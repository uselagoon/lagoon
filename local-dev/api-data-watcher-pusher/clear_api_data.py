#!/usr/bin/env python3

import mysql.connector
import errno

__PATH_TO_NAS__ = "./"

# DataBase connection
try:
    cnx = mysql.connector.connect(user='api', password='api', host='api-db', database='infrastructure')
    cursor = cnx.cursor(buffered=False, dictionary=False)
except mysql.connector.Error as err:
    if err.errno == errorcode.ER_ACCESS_DENIED_ERROR:
        print("Something is wrong with your user name or password")
    elif err.errno == errorcode.ER_BAD_DB_ERROR:
        print("Database does not exist")
    else:
        print(err)


environment = "TRUNCATE TABLE environment"
notification_slack = "TRUNCATE TABLE notification_slack"
notification_email = "TRUNCATE TABLE notification_email"
notification_rocketchat = "TRUNCATE TABLE notification_rocketchat"
notification_microsoftteams = "TRUNCATE TABLE notification_microsoftteams"
project_notification = "TRUNCATE TABLE project_notification"
openshift = "TRUNCATE TABLE openshift"
project = "TRUNCATE TABLE project"
ssh_key = "TRUNCATE TABLE ssh_key"
user_ssh_key = "TRUNCATE TABLE user_ssh_key"
environment_backup = "TRUNCATE TABLE environment_backup"


cursor.execute(environment)
cursor.execute(notification_slack)
cursor.execute(notification_email)
cursor.execute(notification_rocketchat)
cursor.execute(notification_microsoftteams)
cursor.execute(project_notification)
cursor.execute(openshift)
cursor.execute(project)
cursor.execute(ssh_key)
cursor.execute(user_ssh_key)
cursor.execute(environment_backup)

cursor.close()
cnx.close()
