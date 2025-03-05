#!/bin/sh

typeorm migration:run -d dist/typeorm.config.js
node dist/main.js