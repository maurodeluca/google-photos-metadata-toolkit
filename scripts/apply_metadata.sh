#!/bin/bash

BLUE='\033[1;34m'
RED='\033[0;31m'      
YELLOW='\033[0;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Function to display usage information
usage() {
    echo -e "${BLUE}Usage: $0 [-p num_processes] [-h] <input_file>$NC"
    echo
    echo "This script applies metadata to image files based on JSON metadata."
    echo "The input file should contain lines with the following format:"
    echo "  <image_file_path>,<json_metadata_file_path>"
    echo
    echo -e "${BLUE}Options:$NC"
    echo "  -p num_processes   Specify the number of parallel processes to run."
    echo "  -h                 Display this help message."
    echo
    echo -e "${BLUE}Arguments:$NC"
    echo "  input_file   The input file containing image and JSON metadata file paths."
    echo
    echo -e "${BLUE}Example:$NC"
    echo "  ./apply_metadata.sh -p 4 input_file.txt"
    echo "  This will run up to 4 parallel processes to apply metadata."
    echo "  ./apply_metadata.sh input_file.txt"
    echo "  This will run in single-process mode (default)."
    exit 1
}

# Function to check dependencies
check_dependencies() {
    dependencies=("exiftool" "jq")

    for dep in "${dependencies[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            echo "Error: $dep is not installed. Please install it to proceed."
            exit 1
        fi
    done
}

# Check dependencies
check_dependencies

# Default number of parallel processes
num_processes=1

# Parse command line options
while getopts ":p:h" opt; do
  case ${opt} in
    p )
      num_processes="$OPTARG"
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

# Check if the input file is provided
if [ -z "$1" ]; then
    usage
fi

input_file="$1"

# Check if the input file exists
if [ ! -f "$input_file" ]; then
    echo -e "${RED}Error:$NC Input file $RED'$input_file'$NC not found."
    usage
fi


# Function to convert Google Photos JSON to ExifTool JSON
convert_json() {
  local json_file="$1"
  local exif_json_file="$2"
  local image_file="$3"
  
  # Extracting necessary fields from the Google Photos JSON
  title=$(jq -r '.title' "$json_file")
  description=$(jq -r '.description' "$json_file")
  image_views=$(jq -r '.imageViews' "$json_file")
  creation_timestamp=$(jq -r '.creationTime.timestamp' "$json_file")
  photo_taken_timestamp=$(jq -r '.photoTakenTime.timestamp' "$json_file")
  last_modified_timestamp=$(jq -r '.photoLastModifiedTime.timestamp' "$json_file")
  latitude=$(jq -r '.geoData.latitude' "$json_file")
  longitude=$(jq -r '.geoData.longitude' "$json_file")
  altitude=$(jq -r '.geoData.altitude' "$json_file")
  device_type=$(jq -r '.googlePhotosOrigin.mobileUpload.deviceType' "$json_file")
  url=$(jq -r '.url' "$json_file")

  # Converting timestamps to ExifTool date format
  creation_date=$(date -d @"$creation_timestamp" +"%Y:%m:%d %H:%M:%S")
  photo_taken_date=$(date -d @"$photo_taken_timestamp" +"%Y:%m:%d %H:%M:%S")
  
  # Start creating the ExifTool compatible JSON
  cat <<EOF > "$exif_json_file"
[{
  "SourceFile": "$image_file",
  "Title": "$title",
  "Description": "$description",
  "ImageViews": "$image_views",
  "CreateDate": "$creation_date",
  "DateTimeOriginal": "$photo_taken_date",
  "GPSLatitude": $latitude,
  "GPSLongitude": $longitude,
  "GPSAltitude": $altitude,
  "DeviceType": "$device_type",
  "URL": "$url"
EOF

  # Check if last_modified_timestamp is not null before adding ModifyDate
  if [ "$last_modified_timestamp" != "null" ] && [ -n "$last_modified_timestamp" ]; then
    last_modified_date=$(date -d @"$last_modified_timestamp" +"%Y:%m:%d %H:%M:%S")
    echo "  ,\"ModifyDate\": \"$last_modified_date\"" >> "$exif_json_file"
  fi

  # Close the JSON array
  echo "}]" >> "$exif_json_file"
}

# Function to apply metadata to a single file
process_file() {
    local line="$1"
    
    # Split the line into image path and JSON path
    IFS=',' read -ra paths <<< "$line"
    
    image_file="${paths[0]}"
    json_file="${paths[1]}"
    
    if [[ -f "$image_file" && -f "$json_file" ]]; then
        # Create a temporary file for the converted ExifTool JSON
        exif_json_file=$(mktemp /tmp/exiftool_json.XXXXXX)

        # Convert JSON
        convert_json "$json_file" "$exif_json_file" "$image_file"

        # Apply metadata to the image
        exiftool -json="$exif_json_file" "$image_file"

        # Clean up the temporary file
        rm -f "$exif_json_file"
        echo -e "Finished processing ${GREEN}'$image_file'.$NC"
    else
        echo -e "${YELLOW}Warning: Missing file. Skipping $line...$NC"
    fi
}

export -f process_file
export -f convert_json

# Capture start time
start_time=$(date +%s)

# Process each line in the input file
total_lines=$(wc -l < "$input_file")
current_line=0

if [ "$num_processes" -gt 1 ]; then
    # Parallel Processing
    while IFS= read -r line; do
        current_line=$((current_line + 1))
        echo -e "Queueing file ${BLUE}${current_line}${NC} of ${BLUE}${total_lines}${NC}..."
        
        # Process the file in the background
        process_file "$line" &
        
        # Limit the number of parallel processes
        if [[ $(jobs -r -p | wc -l) -ge $num_processes ]]; then
            # Wait for any background process to finish
            wait -n
        fi
    done < "$input_file"
    
    # Wait for all remaining background processes to finish
    wait
else
    # Single Process
    while IFS= read -r line; do
        current_line=$((current_line + 1))
        echo -e "Processing file ${BLUE}${current_line}${NC} of ${BLUE}${total_lines}${NC}..."
        process_file "$line"
    done < "$input_file"
fi

# Capture end time and calculate elapsed time
end_time=$(date +%s)
elapsed_time=$((end_time - start_time))
elapsed_formatted=$(printf '%02d:%02d:%02d' $((elapsed_time / 3600)) $(( (elapsed_time % 3600) / 60 )) $((elapsed_time % 60)))

echo
echo -e "${GREEN}All files processed in $elapsed_formatted.$NC"
echo

# Ask user if they want to keep all original files
read -p "Would you like to keep all original image files in the directory? (Y/n) " choice
case "$choice" in
    [Nn]* )
        while IFS= read -r line; do
          # Split the line into image path and JSON path
          IFS=',' read -ra paths <<< "$line"
          image_file="${paths[0]}"
          rm "${image_file}_original"
        done < "$input_file"
        echo -e "${GREEN}All original files have been removed.$NC"
        ;;
    * )
        ;;
esac
