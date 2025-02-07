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
    return crypto.createHash('sha256').update(recordEntryLine).digest('hex')
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
  
  async create(zoneName: string, record: CreateRecordDto): Promise<Record> {
    const recordLine = `${record.domain} IN ${record.type} ${record.value}`
    this.logger.log(recordLine)
    const hash = await this.generateHashForEntry(recordLine)
    this.logger.log(hash)

    if(await FileUtils.fileExists(`${this.zoneFolderRoot}/db.${zoneName}.d/db.${hash}`)){
      throw new BadRequestException("Record Already Exists")
    }

    this.logger.log("About To Write The File")

    await fsp.writeFile(`${this.zoneFolderRoot}/db.${zoneName}.d/db.${hash}`, recordLine)

    return {
      domain: record.domain,
      type: record.type,
      value: record.value,
      hash: hash
    }
  }

  async findAll(zoneName: string): Promise<Array<Record>> {
    const records = new Array<Record>()

    for(const fileItem of await fsp.readdir(`${this.zoneFolderRoot}/db.${zoneName}.d`, { withFileTypes: true})){
      const lineReader = await FileUtils.getLineReaderOfFile(`${this.zoneFolderRoot}/db.${zoneName}.d/${fileItem.name}`)
      for await (const line of lineReader){
        if(!line.includes("$ORIGIN")){
          // if it does have $ORIGIN in it, then its not one of ours
          const record = await this.convertLineToRecord(line)
          records.push(record)
        }
      }
    }
    
    return records

  }

  
  async findOne(zoneName: string, hash: string): Promise<Record> {
    if(await FileUtils.fileExists(`${this.zoneFolderRoot}/db.${zoneName}.d/db.${hash}`)){
      const lineReader = await FileUtils.getLineReaderOfFile(`${this.zoneFolderRoot}/db.${zoneName}.d/db.${hash}`)
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
    }
    
    throw new NotFoundException("Record Not Found")
  }

  async update(zoneName: string, existingRecordHash: string, record: UpdateRecordDto): Promise<Record> {

    if(await FileUtils.fileExists(`${this.zoneFolderRoot}/db.${zoneName}.d/db.${existingRecordHash}`)){
      const updatedRecord = await this.create(zoneName, { domain: record.domain, type: record.type, value: record.value})
      await this.remove(zoneName, existingRecordHash)

      return updatedRecord
    }

    throw new NotFoundException("Record To Update Was Not Found. Changes Have Not Been Applied")
  }

  async remove(zoneName: string, existingRecordHash: string): Promise<Record> {

    if(await FileUtils.fileExists(`${this.zoneFolderRoot}/db.${zoneName}.d/db.${existingRecordHash}`)){
      const recordDeleted = await this.findOne(zoneName, existingRecordHash)
      await fsp.rm(`${this.zoneFolderRoot}/db.${zoneName}.d/db.${existingRecordHash}`)
      return recordDeleted
    }

    throw new NotFoundException("Record To Delete Was Not Found. Changes Have Not Been Applied")
  }
}
