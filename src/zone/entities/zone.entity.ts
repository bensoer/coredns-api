import { AutoMap } from "@automapper/classes"

export class Zone {

    public static createFromSOAData(zoneName: string, soaLine: string){

        const cleanedEnds = soaLine.trim()
        const singleSpaced = cleanedEnds.replace(/\s+/g, " ")
        const components = singleSpaced.split(" ")

        const zone = new Zone()
        zone.hostname = zoneName
        zone.servername = components[3]
        zone.contact = components[4]
        zone.serial = components[5]
        zone.refresh = Number(components[6])
        zone.retry = Number(components[7])
        zone.expiry = Number(components[8])
        zone.ttl = Number(components[9])

        return zone
    }

    @AutoMap()
    hostname: string

    @AutoMap()
    servername: string

    @AutoMap()
    contact: string

    @AutoMap()
    serial: string

    @AutoMap()
    ttl: number

    @AutoMap()
    refresh: number

    @AutoMap()
    retry: number

    @AutoMap()
    expiry: number
}
