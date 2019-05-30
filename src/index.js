import "@babel/polyfill";

import fs from "fs";
import path from "path";
import glob from "glob-promise";

import ora from "ora";
import colors from "colors";
import prog from "caporal";

import azure from "azure-storage";
import deploy from "deploy-azure-cdn";

import { version } from "../package";

export const run = () => {
  prog
    .version(version)
    .command("deploy", "Deploy a static SPA application")
    .option("--dir <directory>", "App directory to deploy", prog.STRING, "./build", false)
    .option("--container <name>", "Container name", prog.STRING, "$root", false)
    .option("--folder <name>", "Folder name", prog.STRING, "")
    .option("--options <json>", "Container options as a stringified JSON", prog.STRING)
    .option("--prefix <name>", "Prefix for all blobs", prog.STRING)
    .option(
      "--metadata <json>",
      `Container creation options (ex. "{ cacheControl: 'public, max-age=31556926' }"`,
      prog.STRING
    )
    .option("--concurrency <number>", "Number of active network requests", prog.INT, 10)
    .option("--erase <bool>", "Erase all blobs in container/folder before uploading", prog.BOOL, false)
    .option("--zip <bool>", "Gzip all blobs (use smallest)", prog.BOOL, true)
    .option("--test <bool>", "Dry run", prog.BOOL, false)
    .option("--static <bool>", "Use sane default for static apps deploy", prog.BOOL, false)
    .action(async (args, options, logger) => {
      if (options.static) {
        options = {
          ...options,
          container: "$web",
          erase: true,
          options: {
            publicAccessLevel: "blob"
          },
          metadata: {
            cacheControl: "private, no-cache, no-store, must-revalidate",
            cacheControlHeader: "private, no-cache, no-store, must-revalidate"
          }
        };
      }

      const matches = await glob(`${options.dir}/**/*`);
      const fileList = matches.filter(x => fs.lstatSync(x).isFile());
      const files = fileList.map(file => ({
        base: options.dir,
        path: path.resolve(process.cwd(), file)
      }));

      logger.info(`${colors.cyan(`
  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
  ┃          Azure CDN deploy CLI tool          ┃
  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
  `)}
  ${colors.green("Application directory:")}   ${options.dir}
  ${colors.green("Container name:")}          ${options.container}
  ${colors.green("Container options:")}       ${JSON.stringify(options.options || "")}
  ${colors.green("Folder:")}                  ${options.folder}
  ${colors.green("Metadata:")}                ${JSON.stringify(options.metadata || "")}
  ${colors.green("Zip:")}                     ${options.zip}
  ${colors.green("Delete existing:")}         ${options.erase}
  ${colors.green("Test run:")}                ${options.test}
    `);

      const spinner = ora("Deploying to Azure CDN\n").start();

      deploy(
        {
          serviceOptions: [], // arguments for azure.createBlobService
          containerName: options.container, // the container name
          containerOptions: options.options, // container creation options (createContainerIfNotExists)
          folder: options.folder, // prefix for all blobs
          deleteExistingBlobs: options.erase, // erase all blobs in container/folder before uploading
          concurrentUploadThreads: options.concurrency, // number of active network requests with azure
          zip: options.zip, // gzip all blobs (use smallest)
          metadata: options.metadata, // applied to each blob
          testRun: options.test // test run
        },
        files,
        (par1, par2, par3, par4) => spinner.info(`${par1} ${par2} ${par3} ${par4}`),
        err => {
          if (err) {
            spinner.fail(err);
          } else {
            const blobService = azure.createBlobService();

            blobService.setServiceProperties(
              {
                StaticWebsite: {
                  Enabled: true,
                  IndexDocument: "index.html",
                  ErrorDocument404Path: "index.html"
                }
              },
              err => {
                if (err) {
                  spinner.fail(`${err}\n`);
                } else {
                  spinner.succeed("Deploy succeeded\n");
                }
              }
            );
          }
        }
      );
    });

  prog.parse(process.argv);
};
