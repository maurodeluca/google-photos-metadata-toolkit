#!/bin/bash

BLUE='\033[1;34m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Function to display usage information
usage() {
    echo -e "${BLUE}Usage: $0 [-o output_file] [-h] <directory_path>$NC"
    echo
    echo "This script generates an input file that maps image files to their corresponding JSON metadata files."
    echo "The input file can be used by other scripts, like 'apply_metadata.sh', to apply metadata to images."
    echo
    echo -e "${BLUE}Options:$NC"
    echo "  -o output_file   Specify the output file path where the mapping will be saved."
    echo "  -h               Display this help message."
    echo
    echo -e "${BLUE}Arguments:$NC"
    echo "  directory_path   The directory containing the image files and their corresponding JSON metadata files."
    echo
    echo -e "${BLUE}File Naming Convention:$NC"
    echo "  The script expects the JSON metadata files to be named as 'FILENAME.ext.json' where 'FILENAME.ext' is the name of the image file."
    echo "  Example: If the image is 'photo.jpg', the metadata file should be 'photo.jpg.json'."
    echo
    echo -e "${BLUE}Example:${NC}"
    echo "  $0 -o /path/to/output_file.txt /path/to/your/directory"
    echo "  This will generate a file '/path/to/output_file.txt' with lines containing '<image_file_path>,<json_metadata_file_path>'."
    exit 1
}

# Default output file
output_file="files.data"

# Parse command line options
while getopts ":o:" opt; do
  case ${opt} in
    o )
      output_file="$OPTARG"
      ;;
    h )
      usage
      ;;
    \? )
      echo -e "${RED}Invalid option: -${OPTARG}${NC}" >&2
      usage
      ;;
  esac
done
shift $((OPTIND -1))

# Check if directory path is provided
if [ -z "$1" ]; then
  echo -e "${RED}Error: No directory path provided.${NC}"
  usage
fi

# Directory to search
directory="$1"

# Clear the output file if it exists
> "$output_file"

# Find all JSON files and generate input file
find "$directory" -type f -name "*.json" | while read json_file; do
  # Get the corresponding image file path by removing the .json extension
  image_file="${json_file%.json}"
  
  # Check if the image file exists
  if [ -f "$image_file" ]; then
    # Write the image file path and JSON file path to the output file
    echo "$image_file,$json_file" >> "$output_file"
  else
    echo -e "${YELLOW}Warning: Corresponding image file not found for '${json_file}${NC}'"
  fi
done

echo -e "${GREEN}Input file generated: '${output_file}'${NC}"
