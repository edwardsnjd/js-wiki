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
	this.navigate = function(path) {
		// Update url
		router.navigate(path);
		
		// Initiate page fetch
		server.getPage({
			path: path,
			response: _.bind(renderPage, this)
		});
	};
	
	var renderPage = function(page) {
		$("#page").html(page.html)
			.select("a").click(_.bind(onClick, this));
	};
	
	var onClick = function(event) {
		var anchor = event.target;
		var url = $(anchor).attr("href");
		// Ignore absolute urls, capture all others
		if (!/^http(s)?:\/\//.test(url)) {
			event.preventDefault();
			this.navigate(url);
			return false;
		}
	};

	router.on("route:changePath", _.bind(this.navigate, this));	
};