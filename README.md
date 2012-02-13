# README

js-wiki is a tiny javascript web application to display a wiki stored as markdown files as a web site.

Read on for a summary of the project, or see [the details page][details] for installation instructions and
some more technical details.

## Core features

- HTML render of a directory of markdown files
- Any web server will do, no server side processing
- Xcopy installation
- Hash fragment history to allow normal browser navigation
- Simple to extend or customise

## Who should use js-wiki?

For developers or anyone comfortable with web servers and version control systems, writing a wiki in [markdown][md] is great:

- Your wiki is just files available locally, opening up toolsets for editing or processing it
- You can version control the wiki content as you would anything else
- You can collaborate with other people on the wiki as you would anything else
- You can search your wiki content locally as you would other files
- The barrier to writing a new page is very low; it's just a plain text file

Working with the wiki as files locally is great but it's nice to view it in a browser.  there are some great options for
this already (e.g. [Markdoc][mdoc]) but they tend to require packages installed on the server.  js-wiki aims to be even simpler
by rendering the markdown to html on the client.

To turn an existing directory into a web site all
you have to do is point your web server at the directory and copy a single html file (and a few supporting javascript files)
into it.

## Credits

js-wiki is a toy project that came out of idle chat about what we want from a dev wiki at [Bright][bright].

js-wiki is built on a number of fantastic javascript libraries, thank you to everyone who contributes to these
for making projects like this so fun:

- [Underscore][lib.us]
- [Backbone][lib.bb]
- [JQuery][lib.jq]
- [Showdown][lib.sd]

[details]: details.md
[md]: http://daringfireball.net/projects/markdown/
[mdoc]: http://markdoc.org/
[lib.us]: http://documentcloud.github.com/underscore/
[lib.bb]: http://documentcloud.github.com/backbone/
[lib.jq]: http://jquery.com/
[lib.sd]: http://www.showdown.im/
[bright]: http://www.brighttechnologies.com.au/