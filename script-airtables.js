"use strict"

var app = new Vue({
  el: "#main",
  data: {
    showTags: false,

    // base information about the target spreadsheet
    base: {
      // spreadsheet ID
      id: "appp8RtGvuKgXkJz2",
      view: {
        people: 'tblo4BL8WA3CF62j0'
      }
    },
    filter: {
      skills: {}
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

      if ( fresh || ! this.getCache( this.base.id, this.base.view.people )) {
        this.fetchData( this.base.id, this.base.view.people );
      }
    },
    /**
     * fetches data from google via xhr
     * onload places data into cache
     * @param  {string} id    the spreadsheet ID
     * @param  {string} index the sheet id
     * @return none
     */
    fetchData: function ( id, index ) {
      // Init variables
      var self = this
      var app_id = "appp8RtGvuKgXkJz2";
      var app_key = "key1YNmZGtZDdVMYN";
      this.items = []
      axios.get(
          "https://api.airtable.com/v0/" + app_id + "/" + index + "?view=active",
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
        let url = (r.fields.headshot) ? r.fields.headshot[0].thumbnails : false ;
        return Object.assign(r.fields, {
          thumbnail: url
        });
      });
    }
  },
});
