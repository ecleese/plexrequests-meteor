Template.search.onCreated(function () {
  this.results = new ReactiveVar();
  this.error = new ReactiveVar(false);
  this.searching = new ReactiveVar(false);

  Session.set("searchOptions", []);
  Session.set("searchDisabled", false);

  var instance = this;

  Meteor.call("searchOptions", function (error, result) {
    if (result.length !== 0) {
      Session.set("searchOptions", result);
      instance.searchType = new ReactiveVar(Session.get("searchOptions")[0]);
    } else {
      Session.set("searchDisabled", true);
      instance.searchType = new ReactiveVar("none");
    }
  });




});

Template.search.helpers({
	"searchOptions": function () {
    return Session.get("searchOptions");
	},
  "firstSearchOption": function () {
    return Session.get("searchOptions")[0];
  },
  "searchDisabled": function () {
    if (Session.get("searchDisabled") == true) {
      return "disabled";
    }
  },
	"error": function () {
		return Template.instance().error.get();
	},
	"searching": function () {
		return Template.instance().searching.get();
	},
	"searchType": function () {
		return Template.instance().searchType.get();
	},
	'results': function () {
    return Template.instance().results.get();
  },
  'activeSearch' : function () {
    return (Template.instance().searchType.get().length === this.length);
  }
});

Template.search.events({
  'click .search-selector a' : function (event, template) {
    var type = $(event.target).text();
    template.searchType.set(type);
    template.results.set([]);
    $('#search-input').trigger('keyup');
  },
  'keyup  #search-input': _.throttle(function (event, template) {
    // template.results.set([]);

    var searchterm = $(event.target).val().trim();
    var searchType = template.searchType.get();
    var results = [];

    if (searchterm.length > 2) {
      template.searching.set(true);
      template.error.set(false);
      Meteor.call("searchContent", searchterm, searchType, function (error, result) {
        if (error) {
          logger.error(error);
          template.searching.set(false);
          template.error.set(true);
        } else if (result.length) {
          template.searching.set(false);
          template.results.set(result);
        } else {
          template.searching.set(false);
          template.error.set(true);
        }
      });
    }
  }, 1000),
  'submit #search-form': function (event) {
    return false;
  },
  'click .add-request': function (event) {
    var btn = $(event.target);
    var tvBtn = $(event.target).parent().parent().children().first();
    var requestTitle = this.title;
    var request = this;
    request.user = Session.get("user");
    request.episodes = ($(event.target).attr("value") === "true") ? true : false;

    if (this.media_type === "movie") {
      btn.html('<i class="fa fa-spinner fa-spin"></i> &nbsp; Requesting...');
      Meteor.call("requestMovie", request, function (error, result) {
        if (error || result === false) {
          logger.error("Error requesting, please check server log");
          btn.html('<i class="fa fa-plus"></i> &nbsp; Request');
          Bert.alert("Couldn't submit request, please try again!", "danger");
        } else if (result === true) {
          Bert.alert("Successfully requested " + requestTitle + "!", "success");
          // btn.hide();
        } else if (result === "limit") {
          Bert.alert("You've exceeded your weekly limit!", "info");
          btn.html('<i class="fa fa-plus"></i> &nbsp; Request');
        } else if (result === 'exists') {
          Bert.alert("Movie is already on Plex!", "info");
          // btn.hide();
        }
      })
    } else if (this.media_type === "tv") {
      tvBtn.html('<i class="fa fa-spinner fa-spin"></i> &nbsp; Requesting... ');
      Meteor.call("requestTV", request, function (error, result) {
        if (error || result === false) {
          logger.error("Error requesting, please check server log");
          tvBtn.html('<i class="fa fa-plus"></i> &nbsp; Request ');
          Bert.alert("Couldn't submit request, please try again!", "danger");
        } else if (result === true) {
          Bert.alert("Successfully requested " + requestTitle + "!", "success");
          // tvBtn.hide();
        } else if (result === "limit") {
          Bert.alert("You've exceeded your weekly limit!", "info");
          tvBtn.html('<i class="fa fa-plus"></i> &nbsp; Request ');
        } else if (result === 'exists') {
          Bert.alert("TV Show is already on Plex!", "info");
          // tvBtn.hide();
        }
      })
    }
  },
  'click .go-to-top': function () {
		$('body').animate({ scrollTop: 0 }, "slow")
	}
});
