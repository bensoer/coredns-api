import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import { createReadStream, Dirent, createWriteStream } from 'fs';
import * as readline from 'readline/promises'
import { Zone } from './entities/zone.entity';

@Injectable()
export class ZoneService {

  private readonly configurationFolderRoot
  private readonly zoneFolderRoot

  private readonly zoneFileNameRegex = RegExp('^db\\.([\\w]+)\\.([\\w]+)$');

  private readonly logger = new Logger(ZoneService.name);

  constructor(private readonly configService: ConfigService){
    this.configurationFolderRoot = this.configService.getOrThrow("COREDNS_CONFIG_ROOT")
    this.zoneFolderRoot = `${this.configurationFolderRoot}/zones`;
  }

  async create(createZoneDto: CreateZoneDto): Promise<Zone> {

    // Check this zone doesn't already exist. If it does we error
    if(await this.zoneExists(createZoneDto.hostname)){
      throw new BadRequestException("Zone Already Exists")
    }

    // Create a Zone File
    const serialNumber = await this.generateSOASerialNumber()
    const zoneData = 
`$ORIGIN ${createZoneDto.hostname}.
@        IN  SOA ${createZoneDto.servername}. ${createZoneDto.contact.replaceAll("@", ".")}. ${serialNumber} ${createZoneDto.refresh} ${createZoneDto.retry} ${createZoneDto.expiry} ${createZoneDto.ttl}`

    await fs.writeFile(`${this.zoneFolderRoot}/db.${createZoneDto.hostname}`, zoneData)

    // Add A Corefile Configuration
    const coreData = 
`# ${createZoneDto.hostname} Zone Configuration
${createZoneDto.hostname}:53 {
    auto {
        directory ${this.zoneFolderRoot}
    }
    log
    errors
}
`

    // Go through the core file and verify that this entry doesn't already exist. If it does we want to overwrite it with this one
    const lineReader = await this.getLineReaderOfFile(`${this.configurationFolderRoot}/Corefile`)
    const writerFp = createWriteStream(`${this.configurationFolderRoot}/Corefile.new`)

    let startOverwrite = false
    let duplicateFound = false
    let updateWritten = false
    let bracketCount = 0
    for await (const line of lineReader){
      this.logger.debug(line)

      // If we find the opening line, that means we need to start overwriting it with our stuff
      if(line.includes(`${createZoneDto.hostname}:53 {`)){
        startOverwrite = true
        duplicateFound = true
        bracketCount++
      // Its not the opening line, but has an opening bracket and we have already started the overwrite section
      // Increment the count as we need to see the equivelent number of closing brackets before printing
      // the original content again
      }else if(startOverwrite && line.includes(`{`)){
        bracketCount++
      }

      // If we are currently in an overwrite and we spot the } closing bracket. Stop overwriting
      if(startOverwrite == true && line.includes(`}`)){
        bracketCount--
      }else if(startOverwrite == true && bracketCount == 0){
        startOverwrite = false
      }

      // If we are not overwriting anything, just reprint out the current Corefile contents
      // We then say that the update has been written so that we don't keep doing this
      if(!startOverwrite){
        await new Promise<void>((resolve, reject) => {
          writerFp.write(line + "\n", 'utf-8', (error) => {
            if(error){
              reject(error)
            }else{
              resolve()
            }
          })
        })
      }

      // If we are currently in an overwrite, and we have not written the update
      // that means we found the start of the old entry
      // We need to now write out entry into the file
      if(startOverwrite && !updateWritten){
        await new Promise<void>((resolve, reject) => {
          writerFp.write(coreData, 'utf-8', (error) => {
            if(error){
              reject(error)
            }else{
              resolve()
            }
          })
        })
        updateWritten = true
      }
    }

    // IF a duplicate was found, its been updated by now.
    // IF not, then the file has still not been updated

    // So, if a duplicate was NOT found, we now need to write the core data to append it
    if(!duplicateFound){
      await new Promise<void>((resolve, reject) => {
        writerFp.write(coreData, 'utf-8', (error) => {
          if(error){
            reject(error)
          }else{
            resolve()
          }
        })
      })
    }

    // Close all of our pointers and readers
    writerFp.close()
    lineReader.close()

    // Delete the old Corefile and rename the updated one to the same name
    await fs.rm(`${this.configurationFolderRoot}/Corefile`)
    await fs.rename(`${this.configurationFolderRoot}/Corefile.new`, `${this.configurationFolderRoot}/Corefile`)

    // Return our hostname data as a response
    return this.findOne(createZoneDto.hostname)
  }

  private async getAllZoneFiles(): Promise<Array<Dirent>>{
    this.logger.log(`Searching ${this.zoneFolderRoot} For All Zone Files`)
    const zoneFiles = []
    const folderItems = await fs.readdir(this.zoneFolderRoot, {withFileTypes: true})
    for(const folderItem of folderItems) {
      if(!folderItem.isDirectory() && this.zoneFileNameRegex.test(folderItem.name)){
        zoneFiles.push(folderItem)
      }
    }

    this.logger.debug(zoneFiles)
    return zoneFiles
    
  }

  async findAll() : Promise<Array<Zone>> {
    const zones = new Array<Zone>()

    for (const zoneFile of await this.getAllZoneFiles()) {

      const lineReader = await this.getLineReaderOfZoneFile(zoneFile.name)
      const soaLine = await this.findSOALineOfZoneFile(lineReader)

      if(soaLine == null){
        // were not going to error, but unfound SOA Lines will be skipped in output
        lineReader.close()
        continue
      }

      const zoneFileNameComponents = this.zoneFileNameRegex.exec(zoneFile.name)
      const zoneName = `${zoneFileNameComponents[1]}.${zoneFileNameComponents[2]}`

      const zone = Zone.createFromSOAData(zoneName, soaLine)
      zones.push(zone)

    }

    return zones
  }

  async zoneExists(zoneName: string): Promise<boolean>{
    const zoneFilePath = `${this.zoneFolderRoot}/db.${zoneName}`
    try {
      await fs.access(zoneFilePath, fs.constants.F_OK)
      return true
    }catch(error){
      this.logger.debug(error)
      return false
    }
  }

  async getLineReaderOfZoneFile(zoneFileName: string): Promise<readline.Interface>{
    const zoneFilePath = `${this.zoneFolderRoot}/${zoneFileName}`
    return await this.getLineReaderOfFile(zoneFilePath)
  }

  async getLineReaderOfFile(filePath: string): Promise<readline.Interface> {
    const zoneFileStream = createReadStream(filePath)
    return readline.createInterface({ input: zoneFileStream, terminal: false, crlfDelay: Infinity })
  }

  async findSOALineOfZoneFile(lineReader: readline.Interface): Promise<string|null> {
    for await (const line of lineReader){
      if(line.includes("SOA")){
        return line
      }
    }

    return null
  }

  async generateSOASerialNumber(): Promise<string>{
    const utcDateTime = new Date(Date.now())
    return `${String(utcDateTime.getUTCFullYear()).slice(-2)}${('0' + String(utcDateTime.getUTCMonth())).slice(-2)}${( '0' + String(utcDateTime.getUTCDate())).slice(-2)}${('0' + String(utcDateTime.getUTCHours())).slice(-2)}${('0' + String(utcDateTime.getUTCMinutes())).slice(-2)}`
  }

  async findOne(zoneName: string): Promise<Zone> {
    
    if(! await this.zoneExists(zoneName)){
      throw new NotFoundException("Zone Not Found - Zone Does Not Exist")
    }

    const lineReader = await this.getLineReaderOfZoneFile(`db.${zoneName}`)
    const soaLine = await this.findSOALineOfZoneFile(lineReader)
    
    if(soaLine == null){
      lineReader.close()
      throw new NotFoundException("Zone Not Found - SOA Not Specified And Thus Can't Verify")
    }

    const zone = Zone.createFromSOAData(zoneName, soaLine)
    lineReader.close()

    return zone
     
  }

  async update(zoneName: string, updateZoneDto: UpdateZoneDto): Promise<Zone> {
    // Confirm it exists by finding it
    if(! await this.zoneExists(zoneName)){
      throw new NotFoundException("Zone Not Found - Zone Does Not Exist")
    }

    const lineReader = await this.getLineReaderOfZoneFile(zoneName)
    const soaLine = await this.findSOALineOfZoneFile(lineReader)
    
    if(soaLine == null){
      throw new NotFoundException("Zone Not Found - SOA Not Specified And Thus Can't Verify")
    }

    const fp = createWriteStream(`${this.zoneFolderRoot}/new.db.${zoneName}`)

    for await (const line of lineReader){
      if(line.includes("SOA")){

        const serialNumber = await this.generateSOASerialNumber()

        const newSOA = `@ IN SOA ${updateZoneDto.servername}. ${updateZoneDto.contact} ${serialNumber} ${updateZoneDto.refresh} ${updateZoneDto.retry} ${updateZoneDto.expiry} ${updateZoneDto.ttl}`

        await new Promise<void>((resolve, reject) => {
          fp.write(newSOA, (error) => {
            if(error){
              reject(error)
            }else{
              resolve()
            }
          })
        })

      }else{

        try{
          await new Promise<void>((resolve, reject) => {
            fp.write(line, (error) => {
              if(error){
                reject(error)
              }else{
                resolve()
              }
            })
          })
        }catch(error){
          // writing failed, so everything will fail then
          // close the fp
          // close the line reader
          // delete the temp file
          // throw final exception
          fp.close()
          lineReader.close()
          await fs.rm(`${this.zoneFolderRoot}/new.db.${zoneName}`)
          throw new InternalServerErrorException("Zone Update Failed. Changes Have Not Been Applied")
        }
      }
    }

    // all lines have been written. Now we delete the old zone file
    await fs.rm(`${this.zoneFolderRoot}/db.${zoneName}`)
    // rename the new one to the correct name
    await fs.rename(`${this.zoneFolderRoot}/new.db.${zoneName}`, `${this.zoneFolderRoot}/db.${zoneName}`)

    return this.findOne(zoneName)

  }

  async remove(zoneName: string): Promise<Zone> {
    
    if ( ! await this.zoneExists(zoneName)){
      throw new NotFoundException("Zone Not Found - Zone Does Not Exist")
    }

    const copyOfZone = this.findOne(zoneName)

    await fs.rm(`${this.zoneFolderRoot}/db.${zoneName}`)

    return copyOfZone
  }
}
