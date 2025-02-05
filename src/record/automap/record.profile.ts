import { Mapper, MappingProfile, createMap } from "@automapper/core";
import { AutomapperProfile, InjectMapper } from "@automapper/nestjs";
import { Injectable } from "@nestjs/common";
import { Record } from "../entities/record.entity";
import { GetRecordDto } from "../dto/get-record.dto";

@Injectable()
export class ZoneProfile extends AutomapperProfile {
    
    constructor(@InjectMapper() mapper: Mapper){
        super(mapper)
    }

    get profile(): MappingProfile {
        return (mapper) => {
            createMap(mapper, Record, GetRecordDto)
            //createMap(mapper, Retro, GetRetroDto)
            //createMap(mapper, UpdateRetroDto, Retro)
        }
    }
}