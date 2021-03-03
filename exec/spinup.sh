#!/usr/bin/env bash

#########################################################
# Author: Eddie Naff                                    #
# Info: Slack Clone spinup script                       #
# License: MIT (c)                                      #
#########################################################

# Adapted from: https://github.com/lfkdev/bashtemplate/blob/master/example.bash

# color pallet
readonly cf="\\033[0m"
readonly red="\\033[0;31m"
readonly green="\\033[0;32m"
readonly yellow="\\033[0;33m"
readonly purple="\\033[0;35m"
readonly magenta="\\033[0;95m"

is_debug=false # debugmode

trap exit_EXIT EXIT
trap exit_CTRL QUIT SIGINT

main() {
  showhelp
}

example() {
  info "Information"
  warn "Warning!"
  succ "Success!"
  debug "Debug"
}

err() { 
  local _date
  _date=$(showdate)
  echo -e "[$_date][${red}ERROR${cf}]: $1" 1>&2
}

err_die() {
  local _date
  _date=$(showdate)
  echo -e "[$_date][${red}ERROR${cf}]: $1 -> use -h parameter for help." 1>&2
  echo -e "[$_date][${red}ERROR${cf}]: Cleaning & Exiting."
  if [[ "$2" == "1" ]]; then
    showhelp
  fi
  exit 1
}

warn() {
  local _date
  _date=$(showdate)
  echo -e "[$_date][${yellow}WARNING${cf}]: $1"
}

info() {
  local _date
  _date=$(showdate)
  echo -e "[$_date][${magenta}INFO${cf}]: $1 "
} 

succ() {
  local _date
  _date=$(showdate)
  echo -e "[$_date][${green}SUCCESS${cf}]: $1"
}

showdate() {
  local _date
  _date=$(date +%d-%H.%M)
  printf "%s" "$_date"
}

debug () {
  local _date
  _date=$(showdate)
  if [[ "$is_debug" == "true" ]]; then
    echo -e "[$_date][${purple}DEBUG${cf}]: $1"
  fi
}

exit_EXIT() {
  info "Script ended! Cleanup & Exit."
  cleanup
  exit 1
}

exit_CTRL() {
  err "User pressed CTRL+C!"
  exit 1
}

cleanup() {
  info "cleanup.."
}

teardown(){
  # If hquinn-app container is running, turn it off.
  running_app_container=`docker ps | grep hquinn-app | wc -l`
  if [ $running_app_container -gt "0" ]
  then
    docker kill hquinn-app
  fi

  # If turned off hquinn-app container exists, remove it.
  existing_app_container=`docker ps -a | grep hquinn-app | grep Exit | wc -l`
  if [ $existing_app_container -gt "0" ]
  then
    docker rm hquinn-app
  fi

  # If image for hquinn_app exists, remove it.
  existing_app_image=`docker images | grep hquinn_app | wc -l`
  if [ $existing_app_image -gt "0" ]
  then
    docker rmi hquinn_app
  fi

  # If hquinn_app_home volume exists, remove it.
  existing_app_volume=`docker volume ls | grep hquinn_app_home | wc -l`
  if [ $existing_app_volume -gt "0" ]
  then
    docker volume rm hquinn_app_home
  fi

  # If hquinn-net network exists, remove it.
  existing_hquinnnet_network=`docker network ls | grep hquinn-net | wc -l`
  if [ $existing_hquinnnet_network -gt "0" ]
  then
    docker network rm hquinn-net
  fi

  exit 1
  ;;
}

showhelp() {
  echo ""
  echo " Help:"
  echo "  Usage: $0 [-d] / [-h]"
  echo "  Where:"
  echo "    -h: Shows this help text."
  echo "    -d: For optional debug messages."
  echo "    -p: For production spinup."
  echo "    -t: For teardown."
  echo "    -v: For development spinup."
  echo ""
  echo "  Example:"
  echo "  Info:"
  echo ""
}

  while getopts ":hdvpt" opt; do
    case ${opt} in
      h )
        showhelp
        exit 1
        ;;
      d)
        is_debug=true
        ;;
      p )
        # Rebuild image
        docker-compose build

        # Spin up container
        docker-compose up -d
        
        exit 1
        ;;
      t )
        teardown
        ;;
      v)
        echo "DEV MODE BABY!"
        ;;
      \? )
        echo "Invalid option: %s" "$OPTARG" 1>&2
        exit 1
        ;;
    esac
  done


main

# shift $((OPTIND -1))

# printf "USAGE: ./spinup.sh [OPTION]... \n\n" 
# printf "-h for HELP, -d for DEV, -p for PROD, or -t for TEARDOWN \n\n" 
# exit 1
# ;;