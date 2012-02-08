var jswiki = {};

jswiki.page = function(path, html) {
	this.path = path;
	this.html = html;
};

jswiki.fakeda = function() {
	this.retrieveMarkdown = function(options) {
		options.success({path: options.path, md: "Hello, world! [Readme](#foo) ![Some image](celebrate.gif)"});
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

jswiki.browser = function(server) {
	this.navigate = function(path) {
		server.getPage({
			path: path,
			response: function(page) {
				$("#page").html(page.html).select("a").click(onClick);
			}
		});
	};
	
	var onClick = function(event) {
		// event.preventDefault();
		// alert(event);
		// return false;
	};
};
