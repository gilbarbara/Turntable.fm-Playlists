if (typeof(TFMPL) == "undefined") {
	TFMPL = {
		name: "Playlist Manager",
		version: "0.822",
		started: null,
		userData: false,
		lastSong: null,
		songsCounter: null,
		showLog: false,
		playlists: {}
	};
}

TFMPL.log = function(msg) {
	if (TFMPL.showLog) console.log(msg);
};

TFMPL.start = function() {
	TFMPL.log("start");
	this.started = true;
	this.storage.restore();
	this.ui.init();
	
	$(".songlist .queue.realPlaylist").
	sortable("option", { axis: false }).
	filter('.song').
	draggable({
		connectToSortable: ".TFMPL",
		revert: true,
		helper: "clone",
		stack: ".song"
	});
	this.songsCounter = setInterval(function() {
		TFMPL.utils.songsCounter();
	}, 15000)
	
};

TFMPL.updated = function() {
	return Math.round((new Date()).getTime() / 1000).toString();
};

TFMPL.storage = {
	support: function() {
		TFMPL.log("storage.support");
		try {
			return !!localStorage.getItem;
		} catch(e) {
			return false;
		}
	}(),
	backup: function() {
		TFMPL.log("storage.backup");
		var preferences = {
			userid: TFMPL.user.userId,
			songsCount: TFMPL.utils.songsCounter(),
			created: TFMPL.user.created,
			version: TFMPL.version
		};
		if (TFMPL.utils.size(TFMPL.playlists)) {
			localStorage.setItem("TFMPL", "{\"preferences\":" + JSON.stringify(preferences) + ", \"playlists\":" + JSON.stringify(TFMPL.playlists) + "}");
		}
	},
	restore: function() {
		TFMPL.log("storage.restore");
		var storage = localStorage.getItem("TFMPL");
		if(storage !== "undefined" && storage !== null) {
			storage = JSON.parse(storage);
			TFMPL.playlists = storage.playlists;
			$.extend(TFMPL.user, storage.preferences);
			TFMPL.userData = true;
			
			//fixes
			if (TFMPL.user.version < 0.820) {
				TFMPL.user.songsCount = 0;
			}
		}
	},
	destroy: function() {
		TFMPL.log("storage.destroy");
		localStorage.setItem("TFMPL");
	}
};

TFMPL.playlist = {
	create: function(value) {
		TFMPL.log("playlist.create");
		TFMPL.ui.cleanUp();
		var slug = TFMPL.utils.guid(TFMPL.updated());
		TFMPL.playlists[slug] = {
			"name": value,
			"updated": TFMPL.updated(),
			songs: []
		};
		TFMPL.storage.backup();
		TFMPL.ui.menu(slug);
		TFMPL.ui.load(slug);
	},
	save: function() {
		TFMPL.log("playlist.save");
		if ($(".TFMPL .song").length) {
		var songs = [];
			$(".TFMPL .song").each(function() {
				songs.push($(this).data("songData").fileId)
			});
			TFMPL.playlists[$(".TFMPL").data("playlist")].songs = songs;
		}
		else {
			TFMPL.playlists[$(".TFMPL").data("playlist")].songs = [];
			TFMPL.ui.empty();
		}
		TFMPL.playlists[$(".TFMPL").data("playlist")].updated = TFMPL.updated();
		TFMPL.storage.backup();
	},
	remove: function(slug) {
		TFMPL.log("playlist.remove");
		delete TFMPL.playlists[value];
		TFMPL.storage.backup();
		TFMPL.ui.menu();
	}
};

TFMPL.user = {
	userId: turntable.user.id,
	songsCount: 0,
	created: TFMPL.updated(),
	version: this.version
};

TFMPL.ui = {
	init: function() {
		TFMPL.log("ui.init");
		
		if (!$("#TFMPL").length) {
			$("<div/>").
				attr("id", "TFMPL").
				addClass("playlist-container").
				css("left",Math.round((760 + (($(window).width() - 760)) / 2) + 10)).appendTo("body");
				
			$("<div/>").
				addClass("black-right-header").
				html("<a href=\"\#\" class=\"icon\"></a><div class=\"header-text\">Playlists</div><a href=\"\#\" class=\"new\"></a><a href=\"\#\" class=\"options\"></a><a href=\"\#\" class=\"info\"></a><a class=\"help\"></a>").
				appendTo("#TFMPL");
			
			$("<div/>").addClass("TFMPL_CONTENT").appendTo("#TFMPL");
			
			$("<div/>").
			addClass("TFMPL_MENU").appendTo(".TFMPL_CONTENT");
			
			$("<div/>").
				addClass("TFMPL queueView").
				droppable({
					activeClass: "activeClass",
					hoverClass: "hoverClass",
					accept: ".songlist .queue .song",
					scope: "default",
					helper: "clone",
					drop: function( event, ui ) {
						if (!$(".TFMPL .song:data('songData.fileId=" + ui.helper.data("songData").fileId + "')").length) {
							TFMPL.ui.cleanUp();
							$this = ui.helper.clone(true).cleanSong().appendTo(this);
							$(".TFMPL .song").removeClass("nth-child-even").filter(":even").addClass("nth-child-even");
							TFMPL.playlist.save();
						}
					}
				}).
				sortable({
					axis: "y",
					items: ".song",
					placeholder: "highlightClass",
					distance: 15,
					update: function(e,ui) {
						$(".TFMPL .song").removeClass("nth-child-even").filter(":even").addClass("nth-child-even");
						TFMPL.playlist.save();
					}
				}).
				appendTo(".TFMPL_CONTENT");
				$("#TFMPL").draggable({
					handle: ".black-right-header"
				});
		}
		
		var newest = TFMPL.utils.newest();
		this.menu(newest);
		this.load(newest);
		if (!newest) {
			$(".TFMPL").droppable("option", "disabled", true);
			if (!TFMPL.userData) {
				this.help();
			}
			else {
				this.create();
			}
		}
		
	},
	load: function(playlist) {
		TFMPL.log("ui.load");
		this.cleanUp();
		if (playlist && TFMPL.playlists[playlist]) {
			$(".TFMPL").html("").data("playlist", playlist);
			if (playlist) $(".TFMPL").droppable("option", "disabled", false);
			
			var songs = TFMPL.playlists[playlist].songs;
			if (songs.length) {
				for(var i in songs) {
					$(".realPlaylist .song:data('songData.fileId="+ songs[i] +"')").clone(true).cleanSong().appendTo(".TFMPL");
				}
				$("#TFMPL dt").html(TFMPL.playlists[playlist].name);
			}
			else {
				this.empty();
			}
		}
		else {
			this.create();
		}
	},
	menu: function(selected) {
		TFMPL.log("ui.menu");
		
		$menu = $("<dl/>").attr({ id: "TFMPL_MENU" }).addClass("dropdown");
		$menu.append("<dt>" + (selected ? TFMPL.playlists[selected].name : "Playlists") + "</dt>");
		
		var loop = "<div class=\"TFMPL_WRAPPER\"><div class=\"TFMPL_PLAYLISTS\"><ul>";
		for(var i in TFMPL.playlists) {
			loop += "<li data-playlist=\"" + i + "\">" + TFMPL.playlists[i].name + "</li>";
		}
		
		loop += "</ul></div></div>";
		$menu.append("<dd>" + loop + "</dd>");
		$menu.find("ul li").tsort();
		$("#TFMPL .TFMPL_MENU").html($menu);
	},
	create: function() {
		TFMPL.log("ui.create");
		this.cleanUp("TFMPL_NEW");
		if (!$(".TFMPL_NEW:visible").length) {
			$("<div/>").addClass("TFMPL_NEW destroyable").html("<div>Add a new playlist</div><input type=\"text\"/><span>cancel</span>").appendTo("#TFMPL");
			$(".TFMPL_NEW input").populate('name');
			$(".TFMPL_NEW").slideDown(800, "easeOutBounce");
		}
	},
	info: function() {
		TFMPL.log("ui.info");
		this.cleanUp("TFMPL_INFO");
		if (!$(".TFMPL_INFO:visible").length) {
			$("<div/>").addClass("TFMPL_INFO destroyable").appendTo("#TFMPL");
			$("<div/>").addClass("subtitle").html("STATS").appendTo(".TFMPL_INFO");
			$("<div/>").addClass("block").html("<div class=\"number\">" + TFMPL.utils.totalPlaylists() + "</div><div class=\"text\">playlists<br/>&nbsp;</div>").appendTo(".TFMPL_INFO");
			$("<div/>").addClass("block").html("<div class=\"number\">" + TFMPL.utils.totalSongs() + "</div><div class=\"text\">songs in your playlists</div>").appendTo(".TFMPL_INFO");
			$("<div/>").addClass("block").html("<div class=\"number\">" + TFMPL.user.songsCount + "</div><div class=\"text\">songs played since install</div>").appendTo(".TFMPL_INFO");
			$("<div/>").addClass("block").html("<div class=\"number\">" + TFMPL.utils.totalQueue() + "</div><div class=\"text\">songs in your queue</div>").appendTo(".TFMPL_INFO");
			var install = new Date(TFMPL.user.created*1000);
			$("<div/>").addClass("installed").html("installed in " + (install.getMonth() < 9 ? "0" : "") + (install.getMonth() + 1) + "." + (install.getDay() < 9 ? "0" : "") + install.getDay() + "." + install.getFullYear()).appendTo(".TFMPL_INFO");
			
			$("<div/>").addClass("version").html("version: " + TFMPL.version).appendTo(".TFMPL_INFO");
			
			$(".TFMPL_INFO").slideDown(800, "easeOutBounce");
		}

	},
	options: function() {
		TFMPL.log("ui.options");
		this.cleanUp("TFMPL_OPTIONS");
		if (!$(".TFMPL_OPTIONS:visible").length) {
			$("<div/>").addClass("TFMPL_OPTIONS destroyable").appendTo("#TFMPL");
			$("<div/>").addClass("subtitle").html("OPTIONS").appendTo(".TFMPL_OPTIONS");
			$("<div/>").css({ padding: "16px 32px"}).html("Working on it.<br/>Check back soon").appendTo(".TFMPL_OPTIONS");
			$(".TFMPL_OPTIONS").slideDown(800, "easeOutBounce");
		}
	},
	help: function() {
		TFMPL.log("ui.help");
		this.cleanUp("TFMPL_HELP");
		if (!$(".TFMPL_HELP:visible").length) {
			$("<div/>").addClass("TFMPL_HELP destroyable").appendTo("#TFMPL");
			$(".TFMPL_HELP").slideDown(800, "easeOutBounce");
		}
	},
	empty: function() {
		TFMPL.log("ui.empty");
		this.cleanUp();
		$("<div/>").addClass("TFMPL_EMPTY destroyable").appendTo("#TFMPL");
		$(".TFMPL_EMPTY").show();
	},
	cleanUp: function(except) {
		if ($(".TFMPL_WRAPPER").is(":visible")) $("#TFMPL dt").trigger("click");
		$("#TFMPL .destroyable").filter(function(index) {
			return ($(this).hasClass(except) ? false : true);
		}).remove();
	},
	refresh: function() {
		TFMPL.log("ui.refresh");
		if ($("#TFMPL").length) {
			$("#TFMPL").remove();
		}
		this.init();
	},
	destroy: function() {
		TFMPL.log("ui.destroy");
		$("#TFMPL").remove();
	}
};

TFMPL.utils = {
	guid: function(val) {
		TFMPL.log("utils.guid");
		var result = "", replaces = ["Oo", "Ll", "Rr", "Ee", "Aa", "Ss", "Gg", "Tt", "Bb", "Qq"];
		numbers = val.split("");
		for(var i in numbers) {
			capital = Math.floor(Math.random() * 2);
			result += replaces[numbers[i]][capital];
		}
		return result;
	},
	newest: function() {
		TFMPL.log("utils.newest");
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
		TFMPL.log("utils.size");
		var size = 0, key;
		for (key in obj) {
			if (obj.hasOwnProperty(key)) size++;
		}
		return size;
	},
	totalPlaylists: function() {
		TFMPL.log("utils.totalPlaylists");
		return this.size(TFMPL.playlists);
		
	},
	totalSongs: function(slug) {
		TFMPL.log("utils.totalSongs");
		var total = 0, key;
		if(slug) {
			total += TFMPL.playlists[slug].songs.length;
		}
		else {
			for (key in TFMPL.playlists) {
				total += TFMPL.playlists[key].songs.length;
			}
		}
		return total;
	},
	totalQueue: function() {
		TFMPL.log("utils.totalQueue");
		return $(".realPlaylist .song").length;
	},
	songsCounter: function() {
		if ($(".realPlaylist .currentSong").length) {
			if ($(".realPlaylist .currentSong").data('songData').fileId != TFMPL.lastSong) {
				TFMPL.lastSong = $(".realPlaylist .currentSong").data('songData').fileId;
				TFMPL.user.songsCount += + 1;
				TFMPL.storage.backup();
			}
		}
		return TFMPL.user.songsCount;
	}
};

$("#TFMPL a.icon").live("click", function(e) {
	e.preventDefault();
	TFMPL.ui.load($("#TFMPL .TFMPL").data('playlist') ? $("#TFMPL .TFMPL").data('playlist') : TFMPL.utils.newest());
});

$("#TFMPL a.new").live("click", function(e) {
	e.preventDefault();
	TFMPL.ui.create();
});

$("#TFMPL a.options").live("click", function(e) {
	e.preventDefault();
	TFMPL.ui.options();
});

$("#TFMPL a.info").live("click", function(e) {
	e.preventDefault();
	TFMPL.ui.info();
});

$("#TFMPL a.help").live("click", function(e) {
	e.preventDefault();
	TFMPL.ui.help();
});

$("#TFMPL .dropdown dt").live("click", function(e) {
	e.preventDefault();
	if (!$("#TFMPL .TFMPL_PLAYLISTS:visible").length) {
		$(this).closest(".dropdown").find("dd .TFMPL_WRAPPER").stop().animate({ height: 'toggle' }, 800, "easeOutBounce");
	} else {
		$(this).closest(".dropdown").find("dd .TFMPL_WRAPPER").stop().animate({ height: 'toggle' });
	}
	$(this).promise().done(function() {
		if (!$("#TFMPL .TFMPL_PLAYLISTS").data('jsp')) $("#TFMPL .TFMPL_PLAYLISTS").jScrollPane({ hideFocus: true, verticalDragMinHeight: 16 });
		//, verticalDragMaxHeight: 64
	});
	
});
					
$("#TFMPL .dropdown dd ul li").live("click", function(e) {
	e.preventDefault();
	
	$this = $(this);
	var playlist = $this.data("playlist");
	
	if (playlist){
		$this.closest(".dropdown").find("dt").html($this.text()).end().find("dd .TFMPL_WRAPPER").hide();
		TFMPL.ui.load(playlist);
	}
});

$("#TFMPL .TFMPL .remove").live("click", function() {
	$(this).parent().remove();
	TFMPL.playlist.save();
});

$("#TFMPL .TFMPL_NEW input").live("keydown", function(e) {
	var code = (e.keyCode ? e.keyCode : e.which);
	if(code == 13) TFMPL.playlist.create($(this).val());
})

$("#TFMPL .TFMPL_NEW span").live("click", function() {
	$(this).parent().remove();
	TFMPL.ui.load(TFMPL.utils.newest());
});

$("#TFMPL .black-right-header").live("dblclick", function() {
	$(".TFMPL_CONTENT").slideToggle();
});

$().ready(function() {
	setTimeout(function() {
		if (!TFMPL.started) {
			TFMPL.start();
			
		}
	}, 2500);
});

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

$.fn.populate = function (value) {
	return this.each(function() {
		var el = $(this);
		if($.trim(el.val()) == "") {
			el.val(value);
		}
		el.focus(function() {
			if(el.val() == value) {
				el.val("");
			}
		})
		.blur(function() {
			if($.trim(el.val()) == "") {
				el.val(value);
			}
		});
	});
};

/*
* jQuery TinySort - A plugin to sort child nodes by (sub) contents or attributes.
* Version: 1.0.5
*/
(function(b){b.tinysort={id:"TinySort",version:"1.0.5",copyright:"Copyright (c) 2008-2011 Ron Valstar",uri:"http://tinysort.sjeiti.com/",defaults:{order:"asc",attr:"",place:"start",returns:false,useVal:false}};b.fn.extend({tinysort:function(h,j){if(h&&typeof(h)!="string"){j=h;h=null}var e=b.extend({},b.tinysort.defaults,j);var p={};this.each(function(t){var v=(!h||h=="")?b(this):b(this).find(h);var u=e.order=="rand"?""+Math.random():(e.attr==""?(e.useVal?v.val():v.text()):v.attr(e.attr));var s=b(this).parent();if(!p[s]){p[s]={s:[],n:[]}}if(v.length>0){p[s].s.push({s:u,e:b(this),n:t})}else{p[s].n.push({e:b(this),n:t})}});for(var g in p){var d=p[g];d.s.sort(function k(t,s){var i=t.s.toLowerCase?t.s.toLowerCase():t.s;var u=s.s.toLowerCase?s.s.toLowerCase():s.s;if(c(t.s)&&c(s.s)){i=parseFloat(t.s);u=parseFloat(s.s)}return(e.order=="asc"?1:-1)*(i<u?-1:(i>u?1:0))})}var m=[];for(var g in p){var d=p[g];var n=[];var f=b(this).length;switch(e.place){case"first":b.each(d.s,function(s,t){f=Math.min(f,t.n)});break;case"org":b.each(d.s,function(s,t){n.push(t.n)});break;case"end":f=d.n.length;break;default:f=0}var q=[0,0];for(var l=0;l<b(this).length;l++){var o=l>=f&&l<f+d.s.length;if(a(n,l)){o=true}var r=(o?d.s:d.n)[q[o?0:1]].e;r.parent().append(r);if(o||!e.returns){m.push(r.get(0))}q[o?0:1]++}}return this.pushStack(m)}});function c(e){var d=/^\s*?[\+-]?(\d*\.?\d*?)\s*?$/.exec(e);return d&&d.length>0?d[1]:false}function a(e,f){var d=false;b.each(e,function(h,g){if(!d){d=g==f}});return d}b.fn.TinySort=b.fn.Tinysort=b.fn.tsort=b.fn.tinysort})(jQuery);

/*! Copyright (c) 2010 Brandon Aaron (http://brandonaaron.net)
 * Licensed under the MIT License (LICENSE.txt).
 *
 * Thanks to: http://adomas.org/javascript-mouse-wheel/ for some pointers.
 * Thanks to: Mathias Bank(http://www.mathias-bank.de) for a scope bug fix.
 * Thanks to: Seamus Leahy for adding deltaX and deltaY
 *
 * Version: 3.0.4
 * 
 * Requires: 1.2.2+
 */

(function($) {

var types = ['DOMMouseScroll', 'mousewheel'];

$.event.special.mousewheel = {
    setup: function() {
        if ( this.addEventListener ) {
            for ( var i=types.length; i; ) {
                this.addEventListener( types[--i], handler, false );
            }
        } else {
            this.onmousewheel = handler;
        }
    },
    
    teardown: function() {
        if ( this.removeEventListener ) {
            for ( var i=types.length; i; ) {
                this.removeEventListener( types[--i], handler, false );
            }
        } else {
            this.onmousewheel = null;
        }
    }
};

$.fn.extend({
    mousewheel: function(fn) {
        return fn ? this.bind("mousewheel", fn) : this.trigger("mousewheel");
    },
    
    unmousewheel: function(fn) {
        return this.unbind("mousewheel", fn);
    }
});


function handler(event) {
    var orgEvent = event || window.event, args = [].slice.call( arguments, 1 ), delta = 0, returnValue = true, deltaX = 0, deltaY = 0;
    event = $.event.fix(orgEvent);
    event.type = "mousewheel";
    
    // Old school scrollwheel delta
    if ( event.wheelDelta ) { delta = event.wheelDelta/120; }
    if ( event.detail     ) { delta = -event.detail/3; }
    
    // New school multidimensional scroll (touchpads) deltas
    deltaY = delta;
    
    // Gecko
    if ( orgEvent.axis !== undefined && orgEvent.axis === orgEvent.HORIZONTAL_AXIS ) {
        deltaY = 0;
        deltaX = -1*delta;
    }
    
    // Webkit
    if ( orgEvent.wheelDeltaY !== undefined ) { deltaY = orgEvent.wheelDeltaY/120; }
    if ( orgEvent.wheelDeltaX !== undefined ) { deltaX = -1*orgEvent.wheelDeltaX/120; }
    
    // Add event and delta to the front of the arguments
    args.unshift(event, delta, deltaX, deltaY);
    
    return $.event.handle.apply(this, args);
}

})(jQuery);

/*
 * jScrollPane - v2.0.0beta11 - 2011-06-11
 * http://jscrollpane.kelvinluck.com/
 *
 * Copyright (c) 2010 Kelvin Luck
 * Dual licensed under the MIT and GPL licenses.
 */
(function(b,a,c){b.fn.jScrollPane=function(e){function d(D,O){var az,Q=this,Y,ak,v,am,T,Z,y,q,aA,aF,av,i,I,h,j,aa,U,aq,X,t,A,ar,af,an,G,l,au,ay,x,aw,aI,f,L,aj=true,P=true,aH=false,k=false,ap=D.clone(false,false).empty(),ac=b.fn.mwheelIntent?"mwheelIntent.jsp":"mousewheel.jsp";aI=D.css("paddingTop")+" "+D.css("paddingRight")+" "+D.css("paddingBottom")+" "+D.css("paddingLeft");f=(parseInt(D.css("paddingLeft"),10)||0)+(parseInt(D.css("paddingRight"),10)||0);function at(aR){var aM,aO,aN,aK,aJ,aQ,aP=false,aL=false;az=aR;if(Y===c){aJ=D.scrollTop();aQ=D.scrollLeft();D.css({overflow:"hidden",padding:0});ak=D.innerWidth()+f;v=D.innerHeight();D.width(ak);Y=b('<div class="jspPane" />').css("padding",aI).append(D.children());am=b('<div class="jspContainer" />').css({width:ak+"px",height:v+"px"}).append(Y).appendTo(D)}else{D.css("width","");aP=az.stickToBottom&&K();aL=az.stickToRight&&B();aK=D.innerWidth()+f!=ak||D.outerHeight()!=v;if(aK){ak=D.innerWidth()+f;v=D.innerHeight();am.css({width:ak+"px",height:v+"px"})}if(!aK&&L==T&&Y.outerHeight()==Z){D.width(ak);return}L=T;Y.css("width","");D.width(ak);am.find(">.jspVerticalBar,>.jspHorizontalBar").remove().end()}Y.css("overflow","auto");if(aR.contentWidth){T=aR.contentWidth}else{T=Y[0].scrollWidth}Z=Y[0].scrollHeight;Y.css("overflow","");y=T/ak;q=Z/v;aA=q>1;aF=y>1;if(!(aF||aA)){D.removeClass("jspScrollable");Y.css({top:0,width:am.width()-f});n();E();R();w();ai()}else{D.addClass("jspScrollable");aM=az.maintainPosition&&(I||aa);if(aM){aO=aD();aN=aB()}aG();z();F();if(aM){N(aL?(T-ak):aO,false);M(aP?(Z-v):aN,false)}J();ag();ao();if(az.enableKeyboardNavigation){S()}if(az.clickOnTrack){p()}C();if(az.hijackInternalLinks){m()}}if(az.autoReinitialise&&!aw){aw=setInterval(function(){at(az)},az.autoReinitialiseDelay)}else{if(!az.autoReinitialise&&aw){clearInterval(aw)}}aJ&&D.scrollTop(0)&&M(aJ,false);aQ&&D.scrollLeft(0)&&N(aQ,false);D.trigger("jsp-initialised",[aF||aA])}function aG(){if(aA){am.append(b('<div class="jspVerticalBar" />').append(b('<div class="jspCap jspCapTop" />'),b('<div class="jspTrack" />').append(b('<div class="jspDrag" />').append(b('<div class="jspDragTop" />'),b('<div class="jspDragBottom" />'))),b('<div class="jspCap jspCapBottom" />')));U=am.find(">.jspVerticalBar");aq=U.find(">.jspTrack");av=aq.find(">.jspDrag");if(az.showArrows){ar=b('<a class="jspArrow jspArrowUp" />').bind("mousedown.jsp",aE(0,-1)).bind("click.jsp",aC);af=b('<a class="jspArrow jspArrowDown" />').bind("mousedown.jsp",aE(0,1)).bind("click.jsp",aC);if(az.arrowScrollOnHover){ar.bind("mouseover.jsp",aE(0,-1,ar));af.bind("mouseover.jsp",aE(0,1,af))}al(aq,az.verticalArrowPositions,ar,af)}t=v;am.find(">.jspVerticalBar>.jspCap:visible,>.jspVerticalBar>.jspArrow").each(function(){t-=b(this).outerHeight()});av.hover(function(){av.addClass("jspHover")},function(){av.removeClass("jspHover")}).bind("mousedown.jsp",function(aJ){b("html").bind("dragstart.jsp selectstart.jsp",aC);av.addClass("jspActive");var s=aJ.pageY-av.position().top;b("html").bind("mousemove.jsp",function(aK){V(aK.pageY-s,false)}).bind("mouseup.jsp mouseleave.jsp",ax);return false});o()}}function o(){aq.height(t+"px");I=0;X=az.verticalGutter+aq.outerWidth();Y.width(ak-X-f);try{if(U.position().left===0){Y.css("margin-left",X+"px")}}catch(s){}}function z(){if(aF){am.append(b('<div class="jspHorizontalBar" />').append(b('<div class="jspCap jspCapLeft" />'),b('<div class="jspTrack" />').append(b('<div class="jspDrag" />').append(b('<div class="jspDragLeft" />'),b('<div class="jspDragRight" />'))),b('<div class="jspCap jspCapRight" />')));an=am.find(">.jspHorizontalBar");G=an.find(">.jspTrack");h=G.find(">.jspDrag");if(az.showArrows){ay=b('<a class="jspArrow jspArrowLeft" />').bind("mousedown.jsp",aE(-1,0)).bind("click.jsp",aC);x=b('<a class="jspArrow jspArrowRight" />').bind("mousedown.jsp",aE(1,0)).bind("click.jsp",aC);
if(az.arrowScrollOnHover){ay.bind("mouseover.jsp",aE(-1,0,ay));x.bind("mouseover.jsp",aE(1,0,x))}al(G,az.horizontalArrowPositions,ay,x)}h.hover(function(){h.addClass("jspHover")},function(){h.removeClass("jspHover")}).bind("mousedown.jsp",function(aJ){b("html").bind("dragstart.jsp selectstart.jsp",aC);h.addClass("jspActive");var s=aJ.pageX-h.position().left;b("html").bind("mousemove.jsp",function(aK){W(aK.pageX-s,false)}).bind("mouseup.jsp mouseleave.jsp",ax);return false});l=am.innerWidth();ah()}}function ah(){am.find(">.jspHorizontalBar>.jspCap:visible,>.jspHorizontalBar>.jspArrow").each(function(){l-=b(this).outerWidth()});G.width(l+"px");aa=0}function F(){if(aF&&aA){var aJ=G.outerHeight(),s=aq.outerWidth();t-=aJ;b(an).find(">.jspCap:visible,>.jspArrow").each(function(){l+=b(this).outerWidth()});l-=s;v-=s;ak-=aJ;G.parent().append(b('<div class="jspCorner" />').css("width",aJ+"px"));o();ah()}if(aF){Y.width((am.outerWidth()-f)+"px")}Z=Y.outerHeight();q=Z/v;if(aF){au=Math.ceil(1/y*l);if(au>az.horizontalDragMaxWidth){au=az.horizontalDragMaxWidth}else{if(au<az.horizontalDragMinWidth){au=az.horizontalDragMinWidth}}h.width(au+"px");j=l-au;ae(aa)}if(aA){A=Math.ceil(1/q*t);if(A>az.verticalDragMaxHeight){A=az.verticalDragMaxHeight}else{if(A<az.verticalDragMinHeight){A=az.verticalDragMinHeight}}av.height(A+"px");i=t-A;ad(I)}}function al(aK,aM,aJ,s){var aO="before",aL="after",aN;if(aM=="os"){aM=/Mac/.test(navigator.platform)?"after":"split"}if(aM==aO){aL=aM}else{if(aM==aL){aO=aM;aN=aJ;aJ=s;s=aN}}aK[aO](aJ)[aL](s)}function aE(aJ,s,aK){return function(){H(aJ,s,this,aK);this.blur();return false}}function H(aM,aL,aP,aO){aP=b(aP).addClass("jspActive");var aN,aK,aJ=true,s=function(){if(aM!==0){Q.scrollByX(aM*az.arrowButtonSpeed)}if(aL!==0){Q.scrollByY(aL*az.arrowButtonSpeed)}aK=setTimeout(s,aJ?az.initialDelay:az.arrowRepeatFreq);aJ=false};s();aN=aO?"mouseout.jsp":"mouseup.jsp";aO=aO||b("html");aO.bind(aN,function(){aP.removeClass("jspActive");aK&&clearTimeout(aK);aK=null;aO.unbind(aN)})}function p(){w();if(aA){aq.bind("mousedown.jsp",function(aO){if(aO.originalTarget===c||aO.originalTarget==aO.currentTarget){var aM=b(this),aP=aM.offset(),aN=aO.pageY-aP.top-I,aK,aJ=true,s=function(){var aS=aM.offset(),aT=aO.pageY-aS.top-A/2,aQ=v*az.scrollPagePercent,aR=i*aQ/(Z-v);if(aN<0){if(I-aR>aT){Q.scrollByY(-aQ)}else{V(aT)}}else{if(aN>0){if(I+aR<aT){Q.scrollByY(aQ)}else{V(aT)}}else{aL();return}}aK=setTimeout(s,aJ?az.initialDelay:az.trackClickRepeatFreq);aJ=false},aL=function(){aK&&clearTimeout(aK);aK=null;b(document).unbind("mouseup.jsp",aL)};s();b(document).bind("mouseup.jsp",aL);return false}})}if(aF){G.bind("mousedown.jsp",function(aO){if(aO.originalTarget===c||aO.originalTarget==aO.currentTarget){var aM=b(this),aP=aM.offset(),aN=aO.pageX-aP.left-aa,aK,aJ=true,s=function(){var aS=aM.offset(),aT=aO.pageX-aS.left-au/2,aQ=ak*az.scrollPagePercent,aR=j*aQ/(T-ak);if(aN<0){if(aa-aR>aT){Q.scrollByX(-aQ)}else{W(aT)}}else{if(aN>0){if(aa+aR<aT){Q.scrollByX(aQ)}else{W(aT)}}else{aL();return}}aK=setTimeout(s,aJ?az.initialDelay:az.trackClickRepeatFreq);aJ=false},aL=function(){aK&&clearTimeout(aK);aK=null;b(document).unbind("mouseup.jsp",aL)};s();b(document).bind("mouseup.jsp",aL);return false}})}}function w(){if(G){G.unbind("mousedown.jsp")}if(aq){aq.unbind("mousedown.jsp")}}function ax(){b("html").unbind("dragstart.jsp selectstart.jsp mousemove.jsp mouseup.jsp mouseleave.jsp");if(av){av.removeClass("jspActive")}if(h){h.removeClass("jspActive")}}function V(s,aJ){if(!aA){return}if(s<0){s=0}else{if(s>i){s=i}}if(aJ===c){aJ=az.animateScroll}if(aJ){Q.animate(av,"top",s,ad)}else{av.css("top",s);ad(s)}}function ad(aJ){if(aJ===c){aJ=av.position().top}am.scrollTop(0);I=aJ;var aM=I===0,aK=I==i,aL=aJ/i,s=-aL*(Z-v);if(aj!=aM||aH!=aK){aj=aM;aH=aK;D.trigger("jsp-arrow-change",[aj,aH,P,k])}u(aM,aK);Y.css("top",s);D.trigger("jsp-scroll-y",[-s,aM,aK]).trigger("scroll")}function W(aJ,s){if(!aF){return}if(aJ<0){aJ=0}else{if(aJ>j){aJ=j}}if(s===c){s=az.animateScroll}if(s){Q.animate(h,"left",aJ,ae)
}else{h.css("left",aJ);ae(aJ)}}function ae(aJ){if(aJ===c){aJ=h.position().left}am.scrollTop(0);aa=aJ;var aM=aa===0,aL=aa==j,aK=aJ/j,s=-aK*(T-ak);if(P!=aM||k!=aL){P=aM;k=aL;D.trigger("jsp-arrow-change",[aj,aH,P,k])}r(aM,aL);Y.css("left",s);D.trigger("jsp-scroll-x",[-s,aM,aL]).trigger("scroll")}function u(aJ,s){if(az.showArrows){ar[aJ?"addClass":"removeClass"]("jspDisabled");af[s?"addClass":"removeClass"]("jspDisabled")}}function r(aJ,s){if(az.showArrows){ay[aJ?"addClass":"removeClass"]("jspDisabled");x[s?"addClass":"removeClass"]("jspDisabled")}}function M(s,aJ){var aK=s/(Z-v);V(aK*i,aJ)}function N(aJ,s){var aK=aJ/(T-ak);W(aK*j,s)}function ab(aW,aR,aK){var aO,aL,aM,s=0,aV=0,aJ,aQ,aP,aT,aS,aU;try{aO=b(aW)}catch(aN){return}aL=aO.outerHeight();aM=aO.outerWidth();am.scrollTop(0);am.scrollLeft(0);while(!aO.is(".jspPane")){s+=aO.position().top;aV+=aO.position().left;aO=aO.offsetParent();if(/^body|html$/i.test(aO[0].nodeName)){return}}aJ=aB();aP=aJ+v;if(s<aJ||aR){aS=s-az.verticalGutter}else{if(s+aL>aP){aS=s-v+aL+az.verticalGutter}}if(aS){M(aS,aK)}aQ=aD();aT=aQ+ak;if(aV<aQ||aR){aU=aV-az.horizontalGutter}else{if(aV+aM>aT){aU=aV-ak+aM+az.horizontalGutter}}if(aU){N(aU,aK)}}function aD(){return -Y.position().left}function aB(){return -Y.position().top}function K(){var s=Z-v;return(s>20)&&(s-aB()<10)}function B(){var s=T-ak;return(s>20)&&(s-aD()<10)}function ag(){am.unbind(ac).bind(ac,function(aM,aN,aL,aJ){var aK=aa,s=I;Q.scrollBy(aL*az.mouseWheelSpeed,-aJ*az.mouseWheelSpeed,false);return aK==aa&&s==I})}function n(){am.unbind(ac)}function aC(){return false}function J(){Y.find(":input,a").unbind("focus.jsp").bind("focus.jsp",function(s){ab(s.target,false)})}function E(){Y.find(":input,a").unbind("focus.jsp")}function S(){var s,aJ,aL=[];aF&&aL.push(an[0]);aA&&aL.push(U[0]);Y.focus(function(){D.focus()});D.attr("tabindex",0).unbind("keydown.jsp keypress.jsp").bind("keydown.jsp",function(aO){if(aO.target!==this&&!(aL.length&&b(aO.target).closest(aL).length)){return}var aN=aa,aM=I;switch(aO.keyCode){case 40:case 38:case 34:case 32:case 33:case 39:case 37:s=aO.keyCode;aK();break;case 35:M(Z-v);s=null;break;case 36:M(0);s=null;break}aJ=aO.keyCode==s&&aN!=aa||aM!=I;return !aJ}).bind("keypress.jsp",function(aM){if(aM.keyCode==s){aK()}return !aJ});if(az.hideFocus){D.css("outline","none");if("hideFocus" in am[0]){D.attr("hideFocus",true)}}else{D.css("outline","");if("hideFocus" in am[0]){D.attr("hideFocus",false)}}function aK(){var aN=aa,aM=I;switch(s){case 40:Q.scrollByY(az.keyboardSpeed,false);break;case 38:Q.scrollByY(-az.keyboardSpeed,false);break;case 34:case 32:Q.scrollByY(v*az.scrollPagePercent,false);break;case 33:Q.scrollByY(-v*az.scrollPagePercent,false);break;case 39:Q.scrollByX(az.keyboardSpeed,false);break;case 37:Q.scrollByX(-az.keyboardSpeed,false);break}aJ=aN!=aa||aM!=I;return aJ}}function R(){D.attr("tabindex","-1").removeAttr("tabindex").unbind("keydown.jsp keypress.jsp")}function C(){if(location.hash&&location.hash.length>1){var aL,aJ,aK=escape(location.hash);try{aL=b(aK)}catch(s){return}if(aL.length&&Y.find(aK)){if(am.scrollTop()===0){aJ=setInterval(function(){if(am.scrollTop()>0){ab(aK,true);b(document).scrollTop(am.position().top);clearInterval(aJ)}},50)}else{ab(aK,true);b(document).scrollTop(am.position().top)}}}}function ai(){b("a.jspHijack").unbind("click.jsp-hijack").removeClass("jspHijack")}function m(){ai();b("a[href^=#]").addClass("jspHijack").bind("click.jsp-hijack",function(){var s=this.href.split("#"),aJ;if(s.length>1){aJ=s[1];if(aJ.length>0&&Y.find("#"+aJ).length>0){ab("#"+aJ,true);return false}}})}function ao(){var aK,aJ,aM,aL,aN,s=false;am.unbind("touchstart.jsp touchmove.jsp touchend.jsp click.jsp-touchclick").bind("touchstart.jsp",function(aO){var aP=aO.originalEvent.touches[0];aK=aD();aJ=aB();aM=aP.pageX;aL=aP.pageY;aN=false;s=true}).bind("touchmove.jsp",function(aR){if(!s){return}var aQ=aR.originalEvent.touches[0],aP=aa,aO=I;Q.scrollTo(aK+aM-aQ.pageX,aJ+aL-aQ.pageY);aN=aN||Math.abs(aM-aQ.pageX)>5||Math.abs(aL-aQ.pageY)>5;
return aP==aa&&aO==I}).bind("touchend.jsp",function(aO){s=false}).bind("click.jsp-touchclick",function(aO){if(aN){aN=false;return false}})}function g(){var s=aB(),aJ=aD();D.removeClass("jspScrollable").unbind(".jsp");D.replaceWith(ap.append(Y.children()));ap.scrollTop(s);ap.scrollLeft(aJ)}b.extend(Q,{reinitialise:function(aJ){aJ=b.extend({},az,aJ);at(aJ)},scrollToElement:function(aK,aJ,s){ab(aK,aJ,s)},scrollTo:function(aK,s,aJ){N(aK,aJ);M(s,aJ)},scrollToX:function(aJ,s){N(aJ,s)},scrollToY:function(s,aJ){M(s,aJ)},scrollToPercentX:function(aJ,s){N(aJ*(T-ak),s)},scrollToPercentY:function(aJ,s){M(aJ*(Z-v),s)},scrollBy:function(aJ,s,aK){Q.scrollByX(aJ,aK);Q.scrollByY(s,aK)},scrollByX:function(s,aK){var aJ=aD()+Math[s<0?"floor":"ceil"](s),aL=aJ/(T-ak);W(aL*j,aK)},scrollByY:function(s,aK){var aJ=aB()+Math[s<0?"floor":"ceil"](s),aL=aJ/(Z-v);V(aL*i,aK)},positionDragX:function(s,aJ){W(s,aJ)},positionDragY:function(aJ,s){V(aJ,s)},animate:function(aJ,aM,s,aL){var aK={};aK[aM]=s;aJ.animate(aK,{duration:az.animateDuration,ease:az.animateEase,queue:false,step:aL})},getContentPositionX:function(){return aD()},getContentPositionY:function(){return aB()},getContentWidth:function(){return T},getContentHeight:function(){return Z},getPercentScrolledX:function(){return aD()/(T-ak)},getPercentScrolledY:function(){return aB()/(Z-v)},getIsScrollableH:function(){return aF},getIsScrollableV:function(){return aA},getContentPane:function(){return Y},scrollToBottom:function(s){V(i,s)},hijackInternalLinks:function(){m()},destroy:function(){g()}});at(O)}e=b.extend({},b.fn.jScrollPane.defaults,e);b.each(["mouseWheelSpeed","arrowButtonSpeed","trackClickSpeed","keyboardSpeed"],function(){e[this]=e[this]||e.speed});return this.each(function(){var f=b(this),g=f.data("jsp");if(g){g.reinitialise(e)}else{g=new d(f,e);f.data("jsp",g)}})};b.fn.jScrollPane.defaults={showArrows:false,maintainPosition:true,stickToBottom:false,stickToRight:false,clickOnTrack:true,autoReinitialise:false,autoReinitialiseDelay:500,verticalDragMinHeight:0,verticalDragMaxHeight:99999,horizontalDragMinWidth:0,horizontalDragMaxWidth:99999,contentWidth:c,animateScroll:false,animateDuration:300,animateEase:"linear",hijackInternalLinks:false,verticalGutter:4,horizontalGutter:4,mouseWheelSpeed:0,arrowButtonSpeed:0,arrowRepeatFreq:50,arrowScrollOnHover:false,trackClickSpeed:0,trackClickRepeatFreq:70,verticalArrowPositions:"split",horizontalArrowPositions:"split",enableKeyboardNavigation:true,hideFocus:false,keyboardSpeed:0,initialDelay:300,speed:30,scrollPagePercent:0.8}})(jQuery,this);