import { AutoMap } from "@automapper/classes"

export class Record {

    @AutoMap()
    hash: string

    @AutoMap()
    domain: string

    @AutoMap()
    type: string

    @AutoMap()
    value: string
}
