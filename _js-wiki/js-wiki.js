var jswiki = {};

jswiki.da = function() {
	this.retrieveMarkdown = function(options) {
		$.ajax({
			url: options.path,
			dataType: "text",
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

jswiki.pageserver = function(da) {
	this.getPage = function(options) {
		da.retrieveMarkdown({
			path: options.path,
			success: function(result) {
				var html = markdown.toHTML(result.text);
				// NB. Fix paths to come from root of site
				html = jswiki.pathHelper.rootRelativePaths(options.path || "", html);
				options.response({
					path: result.path,
					status: result.status,
					html: html
				});
			},
			error: function(result) {
				var md = _.template("# Error\n\nStatus: {{status}}\n\nDetails: {{error}}", result);
				var html = markdown.toHTML(md);
				options.response({
					path: result.path,
					status: result.status,
					html: html
				});
			}
		});
	};
};

jswiki.browser = function(server) {
	this.navigate = function(path) {
		// Normalise path to ensure only one url identifies a page
		path = jswiki.pathHelper.normalise(path);
		
		// Update state
		router.navigate(path);
		
		// Initiate page fetch
		var me = this;
		server.getPage({
			path: path,
			response: function(response) {
				me.trigger("pageReady", response);
			}
		});
	} ;
	
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
		var pointlessPairRegex = /[a-z0-9]+\/\.\.\//i;
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
	});
	
	var onClick = function(event) {
		var anchor = event.target;
		var url = $(anchor).attr("href");

		// Ignore "protocol:..." urls
		if (/^[a-z]+:/.test(url)) return true;
		// Ignore "//domain/path/..." urls
		if (/^\/\//.test(url)) return true;
		// Ignore unmapped file extensions
		var extensionMatch = /\.([a-z0-9]+)$/.exec(url);
		var extension = extensionMatch ? extensionMatch[1] : "";
		if (extension != "md" && extension != "txt") return true;
		
		// OK, capture the click and pass to browser
		event.preventDefault();
		browser.navigate(url);
		return false;
	};
};

jswiki.pathPanel = function(el, browser) {
	browser.on("pageReady", function(page) {
		// Render link to orig file
		$(el).html(_.template("You are seeing a js-wiki view of <a href='<%= path %>'><%= path %></a>.", page));
	});
};