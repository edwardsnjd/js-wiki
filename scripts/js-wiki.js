var jswiki = {};

jswiki.page = function(path, html) {
	this.path = path;
	this.html = html;
};

jswiki.fakeda = function() {
	this.retrieveMarkdown = function(options) {
		var fakePath = options.path + ".md";
		options.success({path: options.path, md: "Hello, world! [google](http://google.com/) [" + fakePath + "](" + fakePath + ") ![Some image](celebrate.gif)"});
	};
};

jswiki.da = function() {
	this.retrieveMarkdown = function(options) {
		$.ajax({
			url: options.path,
			type: "GET",
			dataType: "text",
			success: function(data, status, xhr) {
				options.success({
					path: options.path,
					md: data
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
				var html = markdown.toHTML(result.md);
				var page = new jswiki.page(result.path, html);
				options.response(page);
			},
			error: function(result) {
				var html = markdown.toHTML(result.status + "\n\n" + result.error);
				var page = new jswiki.page(result.path, html);
				options.response(page);
			}
		});
	};
};

jswiki.browser = function(server) {
	this.navigate = function(path) {
		// Update url
		router.navigate(path);
		
		// Initiate page fetch
		var that = this;
		server.getPage({
			path: path,
			response: function(page) {
				that.trigger("pageReady", page);
			}
		});
	};

	var router = new Backbone.Router();
	router.route("*path", "changePath", _.bind(this.navigate, this));
};
_.extend(jswiki.browser.prototype, Backbone.Events);

jswiki.pagePanel = function(el, browser) {
	browser.on("pageReady", function(page) {
		// Render page and intercept links
		$(el).html(page.html)
			.find("a").click(onClick);
	});
	
	var onClick = function(event) {
		var anchor = event.target;
		var url = $(anchor).attr("href");
		var extensionMatch = /\.([a-z0-9]+)$/.exec(url);
		var extension = extensionMatch ? extensionMatch[1] : "";

		// Ignore absolute urls, capture all others
		if (/^http(s)?:\/\//.test(url)) return true;

		// Ignore unmapped extensions
		if (extension != "md") return true;

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