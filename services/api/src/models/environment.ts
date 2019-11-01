import * as R from 'ramda';
import { asyncPipe } from '@lagoon/commons/src/util';
import { keycloakAdminClient } from '../clients/keycloakClient';
import pickNonNil from '../util/pickNonNil';
import * as logger from '../logger';
import GroupRepresentation from 'keycloak-admin/lib/defs/groupRepresentation';
import { User, transformKeycloakUsers } from './user';

export interface Environment {
  id: Number;                       // int(11) NOT NULL AUTO_INCREMENT,
  name: String;                     // varchar(100) COLLATE utf8_bin DEFAULT NULL,
  project: Number;                  // int(11) DEFAULT NULL,
  deploy_type: String;              // enum('branch','pullrequest','promote') COLLATE utf8_bin DEFAULT NULL,
  environment_type: String;         //  enum('production','development') COLLATE utf8_bin NOT NULL,
  openshift_project_name: String;   // varchar(100) COLLATE utf8_bin DEFAULT NULL,
  updated: String;                  // timestamp NOT NULL DEFAULT current_timestamp(),
  created: String;                  //  timestamp NOT NULL DEFAULT current_timestamp(),
  deleted: String;                  // timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  route: String;                    // varchar(300) COLLATE utf8_bin DEFAULT NULL,
  routes: String;                   // text COLLATE utf8_bin DEFAULT NULL,
  monitoring_urls: String;          // text COLLATE utf8_bin DEFAULT NULL,
  auto_idle: Boolean;               // int(1) NOT NULL DEFAULT 1,
  deploy_base_ref: String;          // varchar(100) COLLATE utf8_bin DEFAULT NULL,
  deploy_head_ref: String;          // varchar(100) COLLATE utf8_bin DEFAULT NULL,
  deploy_title: String;             // varchar(300) COLLATE utf8_bin DEFAULT NULL,
}

export default {};