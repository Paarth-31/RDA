import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: 'http://localhost:8180',   // your WSL docker port
  realm: 'rda',
  clientId: 'rda-desktop',
});

export default keycloak;