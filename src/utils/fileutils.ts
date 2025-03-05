import { createReadStream } from 'fs';
import * as readline from 'readline/promises';
import * as fsp from 'fs/promises';

export class FileUtils {
  public static async getLineReaderOfFile(
    filePath: string,
  ): Promise<readline.Interface> {
    const zoneFileStream = createReadStream(filePath);
    return readline.createInterface({
      input: zoneFileStream,
      terminal: false,
      crlfDelay: Infinity,
    });
  }

  public static async fileExists(filePath: string): Promise<boolean> {
    try {
      await fsp.access(filePath, fsp.constants.F_OK);
      return true;
    } catch (error) {
      return false;
    }
  }
}
