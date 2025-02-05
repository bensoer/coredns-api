import { createReadStream } from "fs"
import * as readline from 'readline/promises'

export class FileUtils {

    public static async getLineReaderOfFile(filePath: string): Promise<readline.Interface> {
        const zoneFileStream = createReadStream(filePath)
        return readline.createInterface({ input: zoneFileStream, terminal: false, crlfDelay: Infinity })
      }
}