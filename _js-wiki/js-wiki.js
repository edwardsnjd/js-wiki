var jswiki = {};

jswiki.da = function() {
	this.retrieveMarkdown = function(options) {
		$.ajax({
			url: options.path,
			dataType: "text",
			cache: false,
			success: function(data, status, xhr) {
				options.success({
					path: options.path,
					status: status,
					text: data
				});
			},
			error: function(xhr, status, error) {
				options.error({
					path: options.path,
					status: status,
					error: error
				});
			}
		});
	};
};

// Each parser must have a toHTML(text) method
jswiki.parsers = {};
jswiki.parsers.markdown = function() {
    var sd = new Showdown.converter();
	this.toHTML = function(text) {
		return sd.makeHtml(text);
	};
};
jswiki.parsers.text = jswiki.parsers.markdown;

jswiki.browser = function(da, options) {
	// Supply default options
	var opts = options || {};
	opts.parserMap = opts.parserMap || {
		"md": new jswiki.parsers.markdown,
		"txt": new jswiki.parsers.text
	};
	opts.defaultPage = opts.defaultPage || "index.md";

	// Navigate to url, or return false if can't
	this.navigate = function(url) {
		// Supply default page if not supplied
		url = url || opts.defaultPage;

		var parser = this.getParser(url);
		if (!parser) return false;
		
		// Normalise path to ensure only one url identifies a page
		var path = jswiki.pathHelper.normalise(url);
		
		// Update browser url
		router.navigate(path);
		
		// Display page
		var me = this;
		da.retrieveMarkdown({
			path: path,
			success: function(result) {
				me.handleResponse({
					path: result.path,
					status: result.status,
					html: parser.toHTML(result.text)
				});
			},
			error: function(result) {
				me.handleResponse({
					path: result.path,
					status: result.status,
					html: _.template("<h1>Error</h1><p>Status: <%=status%></p><p>Details: <%=error%></p>", result)
				});
			}
		});
		
		return true;
	};
	
	this.handleResponse = function(response) {
		// NB. Update paths (in place) to come from root of site
		response.html = jswiki.pathHelper.rootRelativePaths(response.path || "", response.html);
		this.trigger("pageReady", response);
	};
	
	this.getParser = function(url) {
		// Ignore "protocol:..." urls
		if (/^[a-z]+:/.test(url)) return null;
		// Ignore "//domain/path/..." urls
		if (/^\/\//.test(url)) return null;
		
		var extensionMatch = /\.([a-z0-9]+)$/.exec(url);
		var extension = extensionMatch ? extensionMatch[1] : "";
		return opts.parserMap[extension];
	};
	
	var router = new Backbone.Router();
	router.route("*path", "changePath", _.bind(this.navigate, this));	
};
_.extend(jswiki.browser.prototype, Backbone.Events);

jswiki.pathHelper = {
	rootRelativePaths: function(contextPath, html) {
		var contextDirPath = this.getDirectory(contextPath);
		// If no context to add then return markup as is
		if (!contextDirPath) return html;
		// Otherwise prepend context dir before all relative paths
		else return html.replace(/(src|href)=\"(?![a-z]+:)(?!\/)([^"]*)\"/gi, "$1=\"" + contextDirPath + "/$2\"");
	},
	getDirectory: function(path) {
		path = path || "";
		return path.replace(/\/?[^\/]+$/i, "")
	},
	normalise: function(path) {
		// Remove leading parent moves
		var leadingParentRegex = /^\.\.\//;
		while (leadingParentRegex.test(path)) {
			path = path.replace(leadingParentRegex, "");
		}
		// Remove pointless pairs
		var pointlessPairRegex = /[^\/]+\/\.\.\//i;
		while (pointlessPairRegex.test(path)) {
			path = path.replace(pointlessPairRegex, "");
		}
		return path;
	}
};

jswiki.pagePanel = function(el, browser) {
	browser.on("pageReady", function(page) {
		// Render page and intercept links
		$(el).html(page.html)
			.find("a").click(onClick);

		this.trigger("pageRendered", el);
	});

	var onClick = function(event) {
		var anchor = event.target;
		var url = $(anchor).attr("href"); 
 
		// If we fail to navigate to the url, allow default behaviour
		if (!browser.navigate(url)) return true;

		// We've handled this click so cancel default behaviour
		event.preventDefault();
		return false;
	};
};
_.extend(jswiki.pagePanel.prototype, Backbone.Events)

jswiki.pathPanel = function(el, browser) {
	browser.on("pageReady", function(page) {
		// Render link to orig file
		$(el).html(_.template("You are seeing a js-wiki view of <a href='<%= path %>' title='Click to see original file'><%= path %></a> | <a href='#'>Go home</a>", page));
	});
};

jswiki.titleControl = function(pagePanel) {
	pagePanel.on("pageRendered", function(pageEl) {
		// Set window title
		window.document.title = $(pageEl).find("h1").first().text() || "js-wiki";
	});
};

jswiki.tocPanel = function(el, pagePanel) {
	pagePanel.on("pageRendered", function(pageEl) {
		// Populate TOC
		var headings = [];
		$(pageEl).find(":header").each(function(){
			headings.push({
				id: this.id,
				tag: this.tagName.toLowerCase(),
				text: $(this).text()
			});
		});
		if (headings) {
			var headingsMarkup = _.map(headings, function(h) {
				return _.template(
					"<li class='toc_<%=tag%>'><a href='#<%=id%>'><%=text%></a></li>",
					h
				);
			});
			$(el).html("<ul>" + headingsMarkup.join("") + "</ul>");
		} else {
			$(el).html();
		}
		$(el).find("a").click(onClick);
	});

	var onClick = function(event) {
		// Scroll to heading
		var anchor = event.target;
		var url = $(anchor).attr("href"); 
		var id = findHash(url);
		$("html, body").animate({scrollTop: $("#" + id).offset().top});

		// We've handled this click so cancel default behaviour
		event.preventDefault();
		return false;
	};

	var findHash = function(url) {
		return url.replace(/^[^#]*#([^#]*)$/, "$1");
	};
};

jswiki.codePrettifier = function(pagePanel) {
	pagePanel.on("pageRendered", function(pageEl) {
		$(pageEl).find("pre").addClass("prettyprint");
		prettyPrint();
	});
};