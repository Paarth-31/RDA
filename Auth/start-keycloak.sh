#!/bin/bash

export KEYCLOAK_ADMIN=admin
export KEYCLOAK_ADMIN_PASSWORD=admin
cd "$(dirname "$0")/keycloak"
bin/kc.sh start-dev

