import { v4 as uuidv4 } from 'uuid';

export class UUIUtils {
  public static generateUUID() {
    return uuidv4();
  }
}
