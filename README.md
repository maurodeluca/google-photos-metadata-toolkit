# Google Photos Metadata Toolkit

A set of shell scripts designed to automate the process of applying and managing metadata for image files, particularly in batch operations. These scripts are ideal for efficiently handling metadata for large image collections, especially when working with JSON metadata generated by Google Photos.

## Features

- **Batch Metadata Application**: Efficiently apply metadata to multiple image files using corresponding JSON metadata files.
- **Parallel Processing**: Speed up operations by processing multiple files simultaneously (optional).
- **Customizable Output**: Specify output paths and control the number of parallel tasks.
- **Backup Management**: Optionally clean up backup files created during the process.
- **Dependency Checks**: Ensures that all required tools are installed before execution.

## Scripts

### 1. `generate_file_data.sh`

Generates an input file listing image and corresponding JSON metadata file paths. This file is used as input for the `apply_metadata.sh` script.

#### Usage

```bash
./generate_file_data.sh [-o output_file] <directory>
```

#### Options

- `-o output_file` : Specify the output file path for the generated list. Default is `files.datat`.
- `-h` : Display help message.

#### Example

```bash
./generate_file_data.sh -o files.data /path/to/images
```

### 2. `apply_metadata.sh`

Applies metadata to image files using corresponding JSON files listed in the input file generated by `generate_file_data.sh`.

#### Usage

```bash
./apply_metadata.sh [-p num_of_processes] [-o output_dir] input_file
```

#### Options

- `-p num_of_processes` : Number of processes to use (default is sequential processing).
- `-o output_dir` : Specify the output directory for processed files.
- `-h` : Display help message.

#### Example

```bash
./apply_metadata.sh -p 4 -o /output/directory files.data
```

## Dependencies

The scripts rely on the following tools:

- **`exiftool`**: For reading and writing EXIF metadata.

### Install Dependencies

For Arch Linux:

```bash
sudo pacman -S exiftool
```

For Ubuntu Linux:

```bash
sudo apt-get install exiftool
```

## Workflow

1. **Generate Input File**: Use `generate_file_data.sh` to create an input file listing images and their corresponding JSON metadata files.
   
   ```bash
   ./generate_file_data.sh -o input_list.txt /path/to/images
   ```

2. **Apply Metadata**: Run `apply_metadata.sh` with the generated input file to apply metadata to your images.
   
   ```bash
   ./apply_metadata.sh -p 4 -o /output/directory files.data
   ```

3. **Cleanup (Optional)**: After processing, the script will ask if you'd like to remove the backup `_original` files created by `exiftool`.

## Example Usage

```bash
# Step 1: Generate the input list of image and metadata file pairs
./generate_file_data.sh -o my_files.data /path/to/images

# Step 2: Apply the metadata with parallel processing
./apply_metadata.sh -p 4 -o /path/to/output my_files.data
```

## Troubleshooting

### Common Errors

- **"Bad format (0) for IFD0 entry 0"**: This error usually indicates corrupted EXIF metadata. Try running `exiftool` with different options to clean the metadata or strip and reapply it.

### Locale Warnings

If you encounter locale warnings, ensure your system's locale settings are correctly configured:

```bash
export LC_ALL=en_US.UTF-8
export LANG=en_US.UTF-8
```

## Contributing

Feel free to submit issues, fork the repository, and create pull requests. Contributions to improve the scripts and add features are welcome.

## License

This project is licensed under the MIT License.

---
