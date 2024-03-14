// Get our requirements, installed by npm
import { fileURLToPath } from 'node:url'
import { dirname } from 'path'
import Metalsmith  from 'metalsmith';
import markdown from '@metalsmith/markdown';
import layouts from '@metalsmith/layouts';
import ancestry from "metalsmith-ancestry";
import relative from "metalsmith-html-relative";
import permalinks from "@metalsmith/permalinks";
import serve from "@fidian/metalsmith-serve";
import when from "metalsmith-if";

const __dirname = dirname(fileURLToPath(import.meta.url))
const isProduction = process.env.NODE_ENV == 'production';
// Run Metalsmith in the current directory.
// When the .build() method runs, this reads
// and strips the frontmatter from each of our
// source files and passes it on to the plugins.

Metalsmith(__dirname)
    // Obliterate remnants
    .clean(true)
    // Convert blathering blogposts into markdown
    .directory("./ramblings")
    .use(markdown())

    // Convert rest of the website into website
    .directory(".") // Move back to root
    .use(ancestry()) // something something builds an ancestry
    
    // Turns absolute html links from /src as root to relative links
    // Works in templates
    .use(permalinks())  // this builds it all weird and then doesnt resolve the safe links correctly like i cannot get a link working to another page
                        // i reckon i'm just stupid but its been doing my head in for like two hours
    .use(layouts()) // use templates to build website
    .use(relative())
    // Run a test server when it's not on github lol sorry github servers pre me finding out about environment variables
    .use(when(!isProduction, serve()))

    // go metalsmith go!!!!
    .build(function(err, files) {
        if (err) { throw err; }
    });