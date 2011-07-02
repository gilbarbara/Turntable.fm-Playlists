if (typeof(TFMPL) == "undefined") {
	TFMPL = {
		started: null,
		firstInstall: false,
		version: '0.751',
		playlists: { }
	};
}

TFMPL.start = function() {
	this.started = true;
	this.storage.restore();
	this.ui.init();

	$(".songlist .queue.realPlaylist")
	.sortable("option", { axis: false })
	.filter('.song')
	.draggable({
		connectToSortable: ".TFMPL",
		revert: true,
		helper: "clone",
		stack: ".song"
	});
}

TFMPL.storage = {
	updated: Math.round((new Date()).getTime() / 1000).toString(),
	support: function() {
		try {
			return !!localStorage.getItem;
		} catch(e) {
			return false;
		}
	}(),
	create: function(value) {
		$(".TFMPL_NEW").remove();
		var slug = TFMPL.utils.guid(this.updated);
		TFMPL.playlists[slug] = {
			"name": value,
			"updated": this.updated,
			songs: []
		};
		this.backup();
		TFMPL.ui.menu(slug);
		TFMPL.ui.update(slug);
	},
	remove: function(slug) {
		delete TFMPL.playlists[value];
		this.backup();
		TFMPL.ui.menu(slug);
	},
	save: function() {
		if ($(".TFMPL .song").length) {
		var songs = [];
			$(".TFMPL .song").each(function() {
				songs.push($(this).data("songData").fileId)
			});
			TFMPL.playlists[$(".TFMPL").data("playlist")].songs = songs;
		}
		TFMPL.playlists[$(".TFMPL").data("playlist")].updated = this.updated;
		this.backup();
	},
	backup: function() {
		if (TFMPL.utils.size(TFMPL.playlists)) {
			localStorage.setItem("TFMPL", "{\"playlists\":" + JSON.stringify(TFMPL.playlists) + "}");
		}
	},
	restore: function() {
		var storage = localStorage.getItem("TFMPL");
		if(storage !== "undefined" && storage !== null) {
			storage = JSON.parse(storage);
			TFMPL.playlists = storage.playlists;
		}
		else {
			TFMPL.firstInstall = true;
		}
	},
	destroy: function() {
		localStorage.setItem("TFMPL");
	}
}

TFMPL.ui = {
	init: function() {
		if (!$("#TFMPL").length) {
			$("<div/>")
			.attr("id", "TFMPL")
			.addClass("playlist-container")
			.draggable({
				handle: ".black-right-header"
			})
			.appendTo("#outer");
				
			$("<div/>")
			.addClass("black-right-header")
			.html("<img class=\"icon\" src=\"http://kollectiv.org/Turntable.fm-Playlists/images/icon-16.png\"><div class=\"header-text\">Playlists</div>")
			.appendTo("#TFMPL");
			
			$("<div/>").addClass("TFMPL_CONTENT").appendTo("#TFMPL");
			
			$("<div/>")
			.addClass("TFMPL_MENU").appendTo(".TFMPL_CONTENT");
			
			$("<div/>")
			.addClass("TFMPL queueView")
			.droppable({
				activeClass: "activeClass",
				hoverClass: "hoverClass",
				accept: ".songlist .queue .song",
				scope: "default",
				helper: "clone",
				drop: function( event, ui ) {
					if (!$(".TFMPL .song:data('songData.fileId=" + ui.helper.data("songData").fileId + "')").length) {
						if ($(".TFMPL_HELPER").length) $(".TFMPL_HELPER").remove();
						$this = ui.helper.clone(true).cleanSong().appendTo(this);
						$(".TFMPL .song").removeClass("nth-child-even").filter(":even").addClass("nth-child-even");
						TFMPL.storage.save();
					}
				}
			})
			.sortable({
				axis: "y",
				items: ".song",
				placeholder: "highlightClass",
				distance: 15,
				update: function(e,ui) {
					$(".TFMPL .song").removeClass("nth-child-even").filter(":even").addClass("nth-child-even");
					TFMPL.storage.save();
				}
			})
			.appendTo(".TFMPL_CONTENT");
		}
		
		if (TFMPL.utils.newest()) {
			this.update(TFMPL.utils.newest());
		} else {
			$(".TFMPL").droppable("option", "disabled", true);
			$("<div/>").addClass("TFMPL_NEW").html("<div>Add New Playlist</div><input type=\"text\"/>").appendTo("#TFMPL");
			if (TFMPL.firstInstall) {
				$("<div/>").addClass("TFMPL_FIRST").html("<h2>Hello! ;)</h2> To get started create a new playlist.").appendTo(".TFMPL_NEW");
			}
		}
		this.menu(TFMPL.utils.newest());
	},
	update: function(playlist) {
		$(".TFMPL_HELPER").remove();
		$(".TFMPL").html("").data("playlist", playlist);
		if (playlist) $(".TFMPL").droppable("option", "disabled", false);
		
		var songs = TFMPL.playlists[playlist].songs;
		if (songs.length) {
			for(var i in songs) {
				$(".realPlaylist .song:data('songData.fileId="+ songs[i] +"')").clone(true).cleanSong().appendTo(".TFMPL");
			}
		}
		else {
			$("<div/>").addClass("TFMPL_HELPER").html("Drag songs from your queue").appendTo("#TFMPL");
		}
	},
	menu: function(selected) {
		$menu = $("<dl/>").attr({ id: "TFMPL_MENU" }).addClass("dropdown");
		$menu.append("<dt>" + (selected ? TFMPL.playlists[selected].name : "Playlists") + "</dt>");
		
		var loop = "<ul>";
		for(var i in TFMPL.playlists) {
			loop += "<li data-playlist=\"" + i + "\">" + TFMPL.playlists[i].name + "</li>";
		}
		
		loop += "</ul>";
		$menu.append("<dd>" + loop + "</dd>");
		
		$menu.find("li").tsort();
		$menu.find("ul").append("<li class=\"new_playlist\">Create New Playlist</li>");
								
		$("#TFMPL .TFMPL_MENU").html($menu);
	},
	refresh: function() {
		if ($("#TFMPL").length) {
			$("#TFMPL").remove();
		}
		this.init();
	},
	destroy: function() {
		$("#TFMPL").remove();
	}
}

TFMPL.utils = {
	guid: function(val) {
		var result = "", replaces = ["Oo", "Ll", "Rr", "Ee", "Aa", "Ss", "Gg", "Tt", "Bb", "Qq"];
		numbers = val.split("");
		for(var i in numbers) {
			capital = Math.floor(Math.random() * 2);
			result += replaces[numbers[i]][capital];
		}
		return result;
	},
	newest: function() {
		var largest = {
			key: null,
			val: null
		};
		for (var i in TFMPL.playlists) {
			if(TFMPL.playlists[i].updated>largest.val ){
				largest.key = i;
				largest.val = TFMPL.playlists[i].updated;
			}
		}
		return largest.key;
	},
	size: function(obj) {
		var size = 0, key;
		for (key in obj) {
			if (obj.hasOwnProperty(key)) size++;
		}
		return size;
	}
};


$().ready(function() {
	setTimeout(function() {
		if (!TFMPL.started) {
			TFMPL.start();
			
			$(".TFMPL .remove").live("click", function() {
				$(this).parent().remove();
				TFMPL.storage.save();
			});
		}
	}, 5000);
});

$("#TFMPL .dropdown dt").live("click", function(e) {
	e.preventDefault();
	$(this).closest(".dropdown").find("dd ul").slideToggle();
});
					
$(".dropdown dd ul li").live("click", function(e) {
	e.preventDefault();
	
	$this = $(this);
	var playlist = $this.data("playlist");
	
	if (playlist){
		$this.closest(".dropdown").find("dt").html($this.text()).end().find("dd ul").hide();
		TFMPL.ui.update(playlist);
	}
	if ($this.hasClass("new_playlist")) {
		$this.closest(".dropdown").find("dd ul").hide();
		$("<div/>").addClass("TFMPL_NEW").html("<div>Add New Playlist</div><input type=\"text\"/><span>cancel</span>").appendTo("#TFMPL");
	}	
});

$("#TFMPL .TFMPL_NEW input").live("keydown", function(e) {
	var code = (e.keyCode ? e.keyCode : e.which);
	if(code == 13) TFMPL.storage.create($(this).val());
})

$("#TFMPL .TFMPL_NEW span").live("click", function() {
	$(this).parent().remove();
});

$("#TFMPL .black-right-header").live("dblclick", function() {
	$(".TFMPL_CONTENT").slideToggle();
})

$.fn.cleanSong = function () {
	return this.each(function () {
		$(this).css({ position: "", top: "", left: "", zIndex: "auto" }).removeData("draggable").removeData("sortableItem").removeClass("topSong ui-draggable").find(".remove").unbind("click");
	});
};

(function($){
	var checkUndefined = function(a) {
		return typeof a === 'undefined';
	}
	$.expr[':'].data = function(elem, counter, params){
		if(checkUndefined(elem) || checkUndefined(params)) return false;
		var query = params[3];
		if(!query) return false; 
		var querySplitted = query.split('=');
		var selectType = querySplitted[0].charAt( querySplitted[0].length-1 );
		if(selectType == '^' || selectType == '$' || selectType == '!' || selectType == '*'){
			querySplitted[0] = querySplitted[0].substring(0, querySplitted[0].length-1);
			if(!$.stringQuery && selectType != '!'){
				return false;
			}
		}
		else selectType = '=';
		var dataName = querySplitted[0]; 
		var dataNameSplitted = dataName.split('.');
		var data = $(elem).data(dataNameSplitted[0]);
		if(checkUndefined(data)) return false;
		if(dataNameSplitted[1]){
			for(i=1, x=dataNameSplitted.length; i<x; i++){ 
				data = data[dataNameSplitted[i]];
				if(checkUndefined(data)) return false;
			}
		}
		if(querySplitted[1]){ 
			var checkAgainst = (data+'');
			switch(selectType){
				case '=': 
					return checkAgainst == querySplitted[1]; 
				break;
				case '!': 
					return checkAgainst != querySplitted[1];
				break;
				case '^': 
					return $.stringQuery.startsWith(checkAgainst, querySplitted[1]);
				break;
				case '$': 
					return $.stringQuery.endsWith(checkAgainst, querySplitted[1]);
				break;
				case '*': 
					return $.stringQuery.contains(checkAgainst, querySplitted[1]);
				break;
				default: 
					return false;
				break;
			}			
		}
		else{
			return true;
		}
	}
})(jQuery);

/*
* jQuery TinySort - A plugin to sort child nodes by (sub) contents or attributes.
* Version: 1.0.5
*/
(function(b){b.tinysort={id:"TinySort",version:"1.0.5",copyright:"Copyright (c) 2008-2011 Ron Valstar",uri:"http://tinysort.sjeiti.com/",defaults:{order:"asc",attr:"",place:"start",returns:false,useVal:false}};b.fn.extend({tinysort:function(h,j){if(h&&typeof(h)!="string"){j=h;h=null}var e=b.extend({},b.tinysort.defaults,j);var p={};this.each(function(t){var v=(!h||h=="")?b(this):b(this).find(h);var u=e.order=="rand"?""+Math.random():(e.attr==""?(e.useVal?v.val():v.text()):v.attr(e.attr));var s=b(this).parent();if(!p[s]){p[s]={s:[],n:[]}}if(v.length>0){p[s].s.push({s:u,e:b(this),n:t})}else{p[s].n.push({e:b(this),n:t})}});for(var g in p){var d=p[g];d.s.sort(function k(t,s){var i=t.s.toLowerCase?t.s.toLowerCase():t.s;var u=s.s.toLowerCase?s.s.toLowerCase():s.s;if(c(t.s)&&c(s.s)){i=parseFloat(t.s);u=parseFloat(s.s)}return(e.order=="asc"?1:-1)*(i<u?-1:(i>u?1:0))})}var m=[];for(var g in p){var d=p[g];var n=[];var f=b(this).length;switch(e.place){case"first":b.each(d.s,function(s,t){f=Math.min(f,t.n)});break;case"org":b.each(d.s,function(s,t){n.push(t.n)});break;case"end":f=d.n.length;break;default:f=0}var q=[0,0];for(var l=0;l<b(this).length;l++){var o=l>=f&&l<f+d.s.length;if(a(n,l)){o=true}var r=(o?d.s:d.n)[q[o?0:1]].e;r.parent().append(r);if(o||!e.returns){m.push(r.get(0))}q[o?0:1]++}}return this.pushStack(m)}});function c(e){var d=/^\s*?[\+-]?(\d*\.?\d*?)\s*?$/.exec(e);return d&&d.length>0?d[1]:false}function a(e,f){var d=false;b.each(e,function(h,g){if(!d){d=g==f}});return d}b.fn.TinySort=b.fn.Tinysort=b.fn.tsort=b.fn.tinysort})(jQuery);