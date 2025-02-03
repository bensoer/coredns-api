
export class StringUtils {

    public static replaceCharAtIndex(source: string, char: string, index: number) {
        return source.substring(0, index) + char + source.substring(index+1)
    }

    public static trimFromEnd(source: string, charToTrim: string){
        let temp = source
        while(temp.charAt(source.length - 1) == charToTrim){
            temp = temp.substring(0, temp.length - 1)
        }
        return temp
    }

    public static putAtBack(emailWithoutAt: string){
        const lastDotIndex = emailWithoutAt.lastIndexOf('.')
        const atIndex = emailWithoutAt.lastIndexOf('.', lastDotIndex -1)

        return StringUtils.replaceCharAtIndex(emailWithoutAt, '@', atIndex)
    }
}