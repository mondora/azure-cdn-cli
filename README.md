# ⚠️ Deprecation notice: this package is not updated anymore ⚠️

You can replace any automated job with [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli) directly with:

```bash
# Delete the previous deployed artifacts
> az storage azcopy blob delete -c "\$web" --recursive

# Deploy the new ones
> az storage azcopy blob upload -c "\$web" -s "<artifact-dir>/*" --recursive
```

# azure-cdn-cli

Utility CLI to deploy webapps to
[Azure Blob storage](https://docs.microsoft.com/en-us/azure/storage/blobs/storage-blobs-introduction).

## Env vars

This CLI use [`azure-storage`](https://github.com/Azure/azure-storage-node)
under the hood so an `AZURE_STORAGE_CONNECTION_STRING` env var is required to
grant access.

## Usage

### Via CLI

Install the CLI globally with:

```bash
# global install with npm
npm i -g @mondora/azure-cdn-cli

# or yarn
yarn add global @mondora/azure-cdn-cli

# CLI usage
azure-cdn-cli deploy --static --erase
```

### Via `package.json` scripts

Install `@mondora/azure-cdn-cli` as a dev dependency:

```bash
yarn add --dev @mondora/azure-cdn-cli
```

Update your `package.json`:

```json
{
  "scripts": {
    "deploy": "azure-cdn-cli deploy --static --erase"
  }
}
```

## Commands

### deploy

The **only** command provided: deploy your app or directory to
[Azure Blob storage](https://docs.microsoft.com/en-us/azure/storage/blobs/storage-blobs-introduction).

![Help screenshot](./screenshot.png)

## Options

### `--dir`

App directory to deploy.

**Defaults to:** "./build".

### `--container`

Azure Blob container name. See
[here](https://docs.microsoft.com/en-us/rest/api/storageservices/Naming-and-Referencing-Containers--Blobs--and-Metadata)
for further information.

**Defaults to:** "./\$root".

### `--folder`

Mimics directory hierarchy as in a traditional file system.

**Schema:** `AzureStorageAccountName/Container/Folder/**`.

### `--options`

Container creation options. See
[here](https://azure.github.io/azure-storage-node/BlobService.html#createContainerIfNotExists__anchor)
for further documentation.

### `--metadata`

Metadata to be attached to blobs.

### `--concurrency`

Number of parallel active network requests.

### `--erase`

Delete recursively the content of the
[Azure Blob storage](https://docs.microsoft.com/en-us/azure/storage/blobs/storage-blobs-introduction).

### `--zip`

Use zip during file upload.

### `--test`

Flag for dry run.

### `--static`

Flag used as a shorthand for the following [`azure-storage`](https://github.com/Azure/azure-storage-node)
configs.

Should be a sane default to deploy SPAs.

| Container name | Public access | Cache control                                  |
| -------------- | ------------- | ---------------------------------------------- |
| \$web          | blob          | "private, no-cache, no-store, must-revalidate" |
