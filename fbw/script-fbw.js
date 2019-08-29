"use strict"

var app = new Vue({
  el: "#main",
  data: {
    showTags: false,

    // base information about the target spreadsheet
    base: {
      // spreadsheet ID
      id: "appnI6NxijahqhwNo",
      table: 'tblkv17A5fiHT9LKN',
      view: 'viwsPmvqI8gWO3dFo'
    },
    filter: {
      skills: {}
    },
    dateOptions: {
      weekday: 'long',
      hour: 'numeric',
      minute: 'numeric',
      month: 'long',
      day: 'numeric'
    },
    spreadsheet: [],
    cacheLifttime: 0*60*1000, //minutes*60*1000
    loaded: false,
    bgColors: [
      '#EDE9D2',
      '#FFCA00',
      '#FF9D00',
      '#007CCB',
      '#AD1B00',
      '#7FA6CD',
      '#93142E',
      '#3B2E41',
    ]
  },

  /**
   * On creation run method getData
   */
  created: function () {
    this.getData();
  },

  // Vue methods
  methods: {
    /**
     * Loops through this.base.sheets to fetch data
     * @return {[type]} [description]
     */
    getData: function () {
      var fresh = new URL(window.location.href).searchParams.get('fresh')

      // if ( fresh || ! this.getCache( this.base.table, this.base.view )) {
        this.fetchData( this.base.id, this.base.table, this.base.view );
      // }
    },
    /**
     * fetches data from google via xhr
     * onload places data into cache
     * @param  {string} id    the spreadsheet ID
     * @param  {string} index the sheet id
     * @return none
     */
    fetchData: function ( base, table, view ) {
      // Init variables
      var self = this
      var app_key = "key1YNmZGtZDdVMYN";
      this.items = []
      axios.get(
          "https://api.airtable.com/v0/" + base + "/" + table + "?view=" + view,
          {
              headers: { Authorization: "Bearer " + app_key }
          }
      ).then(function(response){
          self.spreadsheet = response.data.records
      }).catch(function(error){
          console.log(error)
      })
    },
    /**
     * Add's data to vue instance
     * Vue's $set method: https://vuejs.org/v2/api/#vm-set
     * @param  {string} data  the JSON string of data
     * @param  {string} index sheet id
     * @return none - uses vue's $set method to update data
     */
    putData: function ( data, index) {
      this.$set(this.spreadsheet, index, JSON.parse( data ));
      this.loaded = true;
    },
    /**
     * Adds data to local storage cache
     * @param  {string} data  JSON string of data
     * @param  {string} id    spreadsheet id (for identification)
     * @param  {string} index sheet id (for identification)
     * @return none
     */
    putCache: function ( data, id, index ) {
      var identity = id + index;
      window.localStorage.setItem( identity , data );
      console.log('data cached');
    },
    /**
     * gets data from the local storage cache
     * @param  {string} id    spreadsheet id
     * @param  {string} index sheet id
     * @return {bool}         true if data is present, false otherwise
     */
    getCache: function ( id, index ) {
      var identity = id + index;
      if ( window.localStorage.getItem( identity ) && this.cacheIsFresh() ) {
        this.putData( window.localStorage.getItem( identity ), index )
        console.log('data loaded from cache');
        return true;
      }

      return false;

    },
    /**
     * tests for cache "setupTime" and if it is expired
     * if there is no "setupTime" current time is added to local storage
     * see vue data "catchLifetime" for cache timeout
     * @return {bool} true if cache is fresh, false otherwise
     */
    cacheIsFresh: function () {
      var now = new Date().getTime();
      var setupTime = localStorage.getItem('setupTime');
      if (setupTime == null) {
          localStorage.setItem('setupTime', now);
          return false; // cache is NOT fresh
      } else {
          if(now - setupTime > this.cacheLifttime) {
              localStorage.clear()
              localStorage.setItem('setupTime', now);
              console.log('cache reset');
              return false; // cache is NOT fresh
          }
          return true; // cache is fresh
      }
    },
    /**
     * strips the http and www from a url
     * @param  {string} url a full URL for website
     * @return {string}     a url without the http and www
     * @TODO gracefull fail if url is null
     */
    stripHTTP: function ( url ) {
      var regex = new RegExp('(https?://(?:www.)?)','gi');
      return url.replace( regex, '' )
    },
    /**
     * Removes the trailing slash from a string
     * @param  {string} str string ready to have it's slash removed
     * @return {return}     string, now without a slash
     * @TODO gracefull fail if str is null
     */
    stripSlash: function ( str ) {
      return str.replace(/\/$/, "");
    },
    /**
     * Makes a URL pretty to look at
     * @param  {string} url a website url
     * @return {string}     a now pretty to look at url
     */
    prettyLink: function ( url ) {
      return this.stripSlash( this.stripHTTP( url ) );
    },
    /**
     * cleans up links to prevent bad things coming from user input
     * @param  {string} url The raw url
     * @return {string}     the clearned up url, if input is false, pass it through
     */
    sanitizeLink: function ( url ) {

      return (url) ? '//' + this.prettyLink( url ) : url ;
    },
    sanitizeInstagram: function (url, prepend) {
      if ( ! url ) return null;
      url = this.prettyLink( url );
      url = url.replace(/(.*\.com\/)|(^@)|/,"@");
      console.log(url);
      return url;
    },
    savePNG: function( id, options ) {
      var node = document.getElementById( id );

      node.classList.toggle('rendering');

      options = {
        height: node.offsetHeight,
        width: node.offsetWidth
      }

      domtoimage.toPng(node, options)
        .then(function (dataUrl) {
          var img = new Image();
          img.src = dataUrl;
          document.getElementById( id + '_images' ).prepend(img);
          node.classList.toggle('rendering');
        })
        .catch(function (error) {
          console.error('oops, something went wrong!', error);
        });
    },
    setColor: function( id, color ) {
        var node = document.getElementById( id );
        node.style.backgroundColor = color;
        if ( this.darkText( color ) ) {
          node.classList.add('text-dark');
          node.classList.remove('text-light');
        } else {
          node.classList.add('text-light');
          node.classList.remove('text-dark');
        }
    },
    darkText: function( hex ){

			/*
			From this W3C document: http://www.webmasterworld.com/r.cgi?f=88&d=9769&url=http://www.w3.org/TR/AERT#color-contrast

			Color brightness is determined by the following formula:
			((Red value X 299) + (Green value X 587) + (Blue value X 114)) / 1000

      I know this could be more compact, but I think this is easier to read/explain.

			*/

			var threshold = 130; /* about half of 256. Lower threshold equals more dark text on dark background  */

			var hRed = hexToR(hex);
			var hGreen = hexToG(hex);
			var hBlue = hexToB(hex);


			function hexToR(h) {return parseInt((cutHex(h)).substring(0,2),16)}
			function hexToG(h) {return parseInt((cutHex(h)).substring(2,4),16)}
			function hexToB(h) {return parseInt((cutHex(h)).substring(4,6),16)}
			function cutHex(h) {return (h.charAt(0)=="#") ? h.substring(1,7):h}

			var cBrightness = ((hRed * 299) + (hGreen * 587) + (hBlue * 114)) / 1000;
			  if (cBrightness > threshold){return true;} else { return false;}
	  },
    sortData: function( action ) {
      let out   = [],
          rows = this.spreadsheet
          self = this;

      for (var i = 0; i < rows.length; i++) {
        out.push( action( rows[i], self ) );
      }

      return out;
    },

  },

  watch: {
  },

  computed: {
    people() {
      return this.sortData( function(r,self){
        let url = (r.fields.Headshot) ? r.fields.Headshot[0].thumbnails : false ;
        return Object.assign(r.fields, {
          thumbnail: url,
          name: r.fields['Speaker Full Name'],
          insta: self.sanitizeInstagram( r.fields.Instagram, 'instagram' ),
          start: new Date( r.fields['Date Time'] ).toLocaleDateString("en-US", self.dateOptions)
        });
      });
    }
  },
});
