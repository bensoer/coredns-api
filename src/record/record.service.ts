import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreateRecordDto } from './dto/create-record.dto';
import { UpdateRecordDto } from './dto/update-record.dto';
import { Record } from './entities/record.entity';
import * as crypto from 'crypto'
import { FileUtils } from 'src/utils/fileutils';
import { Constants } from 'src/utils/constants';
import * as fsp from 'fs/promises'
import { createWriteStream } from 'fs';

@Injectable()
export class RecordService {

  private readonly configurationFolderRoot
  private readonly zoneFolderRoot

  private readonly logger = new Logger(RecordService.name);

  constructor(){
    this.configurationFolderRoot = Constants.COREDNS_CONFIG_ROOT;
    this.zoneFolderRoot = `${this.configurationFolderRoot}/zones`;
  }

  private async generateHashForEntry(recordEntryLine: string): Promise<string>{
    return crypto.createHash('shah256').update(recordEntryLine).digest('base64')
  }

  private async generateHashForRecord(record: Record): Promise<string>{
    const recordLine = `${record.domain} IN ${record.type} ${record.value}`
    return await this.generateHashForEntry(recordLine)
  }

  private async convertLineToRecord(recordLine: string): Promise<Record> {
    const cleanLine = recordLine.trim().replaceAll(/\s+/g, " ")
    const components = cleanLine.split(" ")

    const record = new Record()
    record.domain = components[0]
    record.type = components[2]
    record.value = components[3]
    record.hash = await this.generateHashForEntry(cleanLine)

    return record
  }

  private async recordExists(zoneName: string, recordDomain: string, recordType: string, recordValue: string): Promise<boolean> {
        
    const allRecordsPromise =  this.findAll(zoneName)

    const recordLine = `${recordDomain} IN ${recordType} ${recordValue}`
    const recordHashPromise = this.generateHashForEntry(recordLine)

    const [ knownRecords, recordHash] = await Promise.all([
      allRecordsPromise,
      recordHashPromise
    ])

    const matchingRecords = knownRecords.map((knownRecord) => knownRecord.hash).filter((knownRecordHash) => knownRecordHash == recordHash)

    return matchingRecords.length > 0
  }

  


  async create(zoneName: string, record: CreateRecordDto): Promise<Record> {

    if(await this.recordExists(zoneName, record.domain, record.type, record.value)){
      throw new BadRequestException("Record Already Exists")
    }

    const recordLine = `${record.domain} IN ${record.type} ${record.value}`
    const [recordHash, ] = await Promise.all(
      [
        this.generateHashForEntry(recordLine),
        fsp.appendFile(`${this.zoneFolderRoot}/db.${zoneName}`, recordLine)
      ]
    )

    return {
      domain: record.domain,
      type: record.type,
      value: record.value,
      hash: recordHash
    }
    
  }

  async findAll(zoneName: string): Promise<Array<Record>> {
    const records = new Array<Record>()
    const lineReader = await FileUtils.getLineReaderOfFile(`${this.zoneFolderRoot}/db.${zoneName}`)
    for await (const line of lineReader){
      if(!line.includes("$ORIGIN")){
        // if it does have $ORIGIN in it, then its not one of ours
        const record = await this.convertLineToRecord(line)
        records.push(record)
      }
    }

    return records

  }

  
  async findOne(zoneName: string, hash: string): Promise<Record> {
    const lineReader = await FileUtils.getLineReaderOfFile(`${this.zoneFolderRoot}/db.${zoneName}`)
    for await (const line of lineReader){
      // if it does have $ORIGIN in it, then its not one of ours
      if(!line.includes("$ORIGIN")){
        
        const cleanLine = line.trim().replaceAll(/\s+/g, " ")
        const recordHash = await this.generateHashForEntry(cleanLine)

        if(recordHash == hash){
          const components = cleanLine.split(" ")

          const record = new Record()
          record.domain = components[0]
          record.type = components[2]
          record.value = components[3]
          record.hash = recordHash

          lineReader.close()
          return record

        }
      }
    }

    throw new NotFoundException("Record Not Found")
  }

  async update(zoneName: string, existingRecordHash: string, record: UpdateRecordDto) {
    const lineReader = await FileUtils.getLineReaderOfFile(`${this.zoneFolderRoot}/db.${zoneName}`)
    const newZoneFileFp = createWriteStream(`${this.zoneFolderRoot}/new.db.${zoneName}`)
    
    const updatedRecordLine = `${record.domain} IN ${record.type} ${record.value}`
    let updateApplied = false

    for await (const line of lineReader){
      // if it does have $ORIGIN in it, then its not one of ours
      if(!line.includes("$ORIGIN")){
        
        // clean the line and generate its hash value
        let nextLine = line.trim().replaceAll(/\s+/g, " ")
        const recordHash = await this.generateHashForEntry(nextLine)

        // IF the hash matches ours, then we know this line is the one we
        // want to modify
        if(recordHash == existingRecordHash){
          nextLine = updatedRecordLine
          updateApplied = true
        }

        // Now print back the line - this might be the updated one if its hash matches
        try{
          await new Promise<void>((resolve, reject) => {
            newZoneFileFp.write(nextLine + "\n", (error) => {
              if(error){
                reject(error)
              }else{
                resolve()
              }
            })
          })
        }catch(error){
          this.logger.error(error)
          newZoneFileFp.close()
          lineReader.close()
          await fsp.rm(`${this.zoneFolderRoot}/new.db.${zoneName}`)
          throw new InternalServerErrorException("Record Update Failed. Changes Have Not Been Applied")
        }
      }
    }

    // Check a match was found, as its possible we just looped and didn't find anything
    if(!updateApplied){
      throw new NotFoundException("Record To Update Was Not Found. Changes Have Not Been Applied")
    }

    // all lines have been written. Now we delete the old zone file
    await fsp.rm(`${this.zoneFolderRoot}/db.${zoneName}`)
    // rename the new one to the correct name
    await fsp.rename(`${this.zoneFolderRoot}/new.db.${zoneName}`, `${this.zoneFolderRoot}/db.${zoneName}`)

    const updatedRecord = new Record()
    updatedRecord.domain = record.domain
    updatedRecord.type = record.type
    updatedRecord.value = record.value
    updatedRecord.hash = await this.generateHashForEntry(updatedRecordLine)

    return updatedRecord
  }

  async remove(zoneName: string, existingRecordHash: string): Promise<Record> {

    const lineReader = await FileUtils.getLineReaderOfFile(`${this.zoneFolderRoot}/db.${zoneName}`)
    const newZoneFileFp = createWriteStream(`${this.zoneFolderRoot}/new.db.${zoneName}`)

    let deletedRecord: Record | null = null

    for await (const line of lineReader){
      // if it does have $ORIGIN in it, then its not one of ours
      if(!line.includes("$ORIGIN")){
        
        // clean the line and generate its hash value
        let nextLine = line.trim().replaceAll(/\s+/g, " ")
        const recordHash = await this.generateHashForEntry(nextLine)

        // IF the hash matches ours, then we know this line is the one we
        // want to delete
        if(recordHash == existingRecordHash){
          deletedRecord = await this.convertLineToRecord(nextLine)
          continue
        }

        // Now print back the line - this might be the updated one if its hash matches
        try{
          await new Promise<void>((resolve, reject) => {
            newZoneFileFp.write(nextLine + "\n", (error) => {
              if(error){
                reject(error)
              }else{
                resolve()
              }
            })
          })
        }catch(error){
          this.logger.error(error)
          newZoneFileFp.close()
          lineReader.close()
          await fsp.rm(`${this.zoneFolderRoot}/new.db.${zoneName}`)
          throw new InternalServerErrorException("Record Update Failed. Changes Have Not Been Applied")
        }
      }
    }

    // Check a match was found, as its possible we just looped and didn't find anything
    if(deletedRecord == null){
      throw new NotFoundException("Record To Delete Was Not Found. Changes Have Not Been Applied")
    }

    // all lines have been written. Now we delete the old zone file
    await fsp.rm(`${this.zoneFolderRoot}/db.${zoneName}`)
    // rename the new one to the correct name
    await fsp.rename(`${this.zoneFolderRoot}/new.db.${zoneName}`, `${this.zoneFolderRoot}/db.${zoneName}`)

    return deletedRecord
  }
}
