#!/bin/bash -x

## This script will tag all ebs volumes with the same `Environment` and `Name` tag as their connected ec2 instances
##
## Usage:
## ./aws-tag-ebs-volumes-with-instance-tags.sh environment-tag
##
## $1: Required - Name of `Environment` tag that should be used to filter ec2 instances
##
##Adapted from https://github.com/isuru-yasantha/Scripts-for-AWS/blob/master/ebstag.sh

#getting instance ids

for i in $(aws ec2 describe-instances  --filter Name=tag-value,Values=$1--query 'Reservations[*].Instances[*].InstanceId' --output text); do
# getting tag values based on key values
iName=$(aws ec2 describe-instances --instance-id $i --query 'Reservations[].Instances[].[Tags[?Key==`Name`].Value | [0]]' --output text)
iEnvironment=$(aws ec2 describe-instances --instance-id $i --query 'Reservations[].Instances[].[Tags[?Key==`Environment`].Value | [0]]' --output text)

#getting volume ids attached to the instances
   for j in $(aws ec2 describe-volumes --filters Name=attachment.instance-id,Values=$i --query 'Volumes[*].{ID:VolumeId}' --output text); do
# checking there tag values
   vName=$(aws ec2 describe-volumes --volume-id $j --query 'Volumes[].[Tags[?Key==`Name`].Value | [0]]' --output text)
   vEnvironment=$(aws ec2 describe-volumes --volume-id $j --query 'Volumes[].[Tags[?Key==`Environment`].Value | [0]]' --output text)

# if there are no tag values assign instance tag values to  the volumes

          if [ "$iName" != "None" ] && [ "$vName" == "None" ]; then
              aws ec2 create-tags --resources $j --tags Key=Name,Value="'`echo $iName`'"

          fi

          if [ "$iEnvironment" != "None" ] && [ "$vEnvironment" == "None" ]; then
              aws ec2 create-tags --resources $j --tags Key=Environment,Value=`echo $iEnvironment`
          fi
   done
done
