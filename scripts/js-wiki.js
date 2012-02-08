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

jswiki.parser = function() {
	this.parse = function(md) {
		return markdown.toHTML(md);
	};
};

jswiki.pageserver = function(da, parser) {
	this.getPage = function(options) {
		da.retrieveMarkdown({
			path: options.path,
			success: function(result) {
				var html = parser.parse(result.md);
				var page = new jswiki.page(result.path, html);
				options.response(page);
			},
			error: function(result) {
				var html = parser.parse(result.status + "\n\n" + result.error);
				var page = new jswiki.page(result.path, html);
				options.response(page);
			}
		});
	};
};

jswiki.router = Backbone.Router.extend({
	routes: {
		"*path": "changePath"
	}
});

jswiki.browser = function(server, router) {	
	var that = this;
	
	this.navigate = function(path) {
		// Update url
		router.navigate(path);
		
		// Initiate page fetch
		server.getPage({
			path: path,
			response: function(page) {
				that.trigger("pageReady", page);
			}
		});
	};
	
	router.on("route:changePath", _.bind(this.navigate, this));	
};
_.extend(jswiki.browser.prototype, Backbone.Events);

jswiki.pathPanel = function(el, browser) {
	browser.on("pageReady", function(page) {
		$(el).html(page.path);
	});
};

jswiki.pagePanel = function(el, browser) {
	browser.on("pageReady", function(page) {
		$(el).html(page.html)
			.select("a").click(onClick);
	});
	
	var onClick = function(event) {
		var anchor = event.target;
		var url = $(anchor).attr("href");
		// Ignore absolute urls, capture all others
		if (!/^http(s)?:\/\//.test(url)) {
			event.preventDefault();
			browser.navigate(url);
			return false;
		}
	};
}