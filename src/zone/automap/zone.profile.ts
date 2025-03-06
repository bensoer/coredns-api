import {
  Mapper,
  MappingProfile,
  createMap,
  forMember,
  mapFrom,
} from '@automapper/core';
import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { Injectable } from '@nestjs/common';
import { GetZoneDto } from '../dto/get-zone.dto';
import { Zone } from '../entities/zone.entity';
import { StringUtils } from '../../utils/stringutils';

@Injectable()
export class ZoneProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  get profile(): MappingProfile {
    return (mapper) => {
      createMap(
        mapper,
        Zone,
        GetZoneDto,
        // If contact has no @ sign for the email. Replace the first '.' we run into with the @
        forMember(
          (destination) => destination.contact,
          mapFrom((source) =>
            StringUtils.putAtBack(StringUtils.trimFromEnd(source.contact, '.')),
          ),
        ),
        forMember(
          (destination) => destination.hostname,
          mapFrom((source) => StringUtils.trimFromEnd(source.hostname, '.')),
        ),
        forMember(
          (destination) => destination.servername,
          mapFrom((source) => StringUtils.trimFromEnd(source.servername, '.')),
        ),
      );
      //createMap(mapper, Retro, GetRetroDto)
      //createMap(mapper, UpdateRetroDto, Retro)
    };
  }
}
