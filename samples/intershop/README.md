# Contentful UI Extension to load products from Intershop's Storefront API

Adds a custom UI field to Contentful that allows users to search and select Intershop products.

## Overview

TODO

## Usage

Login on contentful and navigate to the space you want the extension to be depoloyed in, then run `yarn contentful login`. Allow the browser window to open, and paste the generated hash in the console. Afterwards, run `yarn contentful space use`.
Once this is done, if the extension does not exist in the contentful space yet, run `yarn create`.
Now, run `yarn autopublish`, so the extension gets updated each time you make changes to the project. Alternatively, do not run any commands, and once you want to publish the newly developed code, run `yarn update` manually.
