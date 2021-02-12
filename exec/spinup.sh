#!/bin/bash

while getopts ":hdpt" opt; do
  case ${opt} in
    h )
      printf "USAGE: ./spinup.sh [OPTION]... \n\n" 
      printf "-h for HELP, -d for DEV, -p for PROD, or -t for TEARDOWN \n\n"  
      exit 1
      ;;
    d )
      exit 1
      ;;
    p )
      exit 1
      ;;
    t )
      exit 1
      ;;
    \? )
      echo "Invalid option: %s" "$OPTARG" 1>&2
      exit 1
      ;;
  esac
done
shift $((OPTIND -1))

printf "USAGE: ./spinup.sh [OPTION]... \n\n" 
printf "-h for HELP, -d for DEV, -p for PROD, or -t for TEARDOWN \n\n" 
exit 1
;;