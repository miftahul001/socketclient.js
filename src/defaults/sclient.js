function _socketClient() {
  var _ = this, sock = null, trans, nerr, thrd, outp, inpb, inps, onms;
  
  _.isConnected = function() {
    if (sock == null) { return false; }
    return sock.isAlive();    
  }
  
  _.getServer = function() {
    if (_.isConnected()) {
      return sock.host;
    }	  
    return '';
  }
  
  _.getPort = function() {
    if (_.isConnected()) {
      return sock.port;
    }
    return '';
  }
  
  _.onnotify = function(status, msg) {}
  
  _.onmessage = function(msg) {}
  
  onms = {
    onTransportStatus: function (aTransport, aStatus, aProgress, aProgressMax) {
      if (aStatus==0x804b0003) {
        _.onnotify('Notification', 'RESOLVING');
      }
      else if (aStatus==0x804b000b) {
        _.onnotify('Notification', 'RESOLVED');
      }
      else if (aStatus==0x804b0007) {
        _.onnotify('Notification', 'CONNECTING');
      }
      else if (aStatus==0x804b0004) {
        _.onnotify('Notification', 'CONNECTED');
      }
      else if (aStatus==0x804b0005) {
        _.onnotify('Notification', 'SENDING');
      }
      else if (aStatus==0x804b000a) {
        _.onnotify('Notification', 'WAITING');
      }
      else if (aStatus==0x804b0006) {
        _.onnotify('Notification', 'RECEIVING');
        try {
          var readBytes = inps.available(), res = '';
          res = inps.read(readBytes);
          _.onmessage(res);
        }
        catch(e) {
          _.onnotify('Error', e);
        }
      }
      else {
        _.onnotify('Notification', 'Unknown');
      }
    }
  };
  
  _.connect = function(host, port, recvcb, statcb) {
    if (_.isConnected()) {
      _.disconnect();
    }
    if (sock == null) {
      trans = Components.classes["@mozilla.org/network/socket-transport-service;1"].getService(Components.interfaces.nsISocketTransportService);
      nerr = Components.classes["@mozilla.org/xpcom/error-service;1"].getService(Components.interfaces.nsIErrorService);
      thrd = Components.classes["@mozilla.org/thread-manager;1"].getService(Components.interfaces.nsIThreadManager).mainThread;
      inps = Components.classes["@mozilla.org/scriptableinputstream;1"].createInstance(Components.interfaces.nsIScriptableInputStream);
    }
    
    //_.onmessage = recvcb;
    //_.onnotify = statcb;
    
    try {
      sock = trans.createTransport(null, 0, host, port, null);
      sock.setEventSink(onms, thrd);
      //inpb = sock.openInputStream(Components.interfaces.nsITransport.OPEN_BLOCKING | Components.interfaces.nsITransport.OPEN_UNBUFFERED, 0, 0);
      outp = sock.openOutputStream(Components.interfaces.nsITransport.OPEN_BLOCKING | Components.interfaces.nsITransport.OPEN_UNBUFFERED, 0, 0);
      inpb = sock.openInputStream(null, 0, 0);
      inps.init(inpb);
      //_.onnotify('Notification', 'Connected');
    }
    catch(e) {
      sock = null;
      _.onnotify('Error', e);
    }
  }
  
  _.disconnect = function() {
    if (_.isConnected()) {
      inps.close();
      outp.close();
      inpb.close();
      sock = null;
      _.onnotify('Notification', 'Disconnected');
    }
  }
  
  _.send = function (msg, msgLen) {
    try {
      outp.write(msg, msgLen);
      outp.flush();
    }
    catch(e) {
      _.onnotify('Error', e);
    }
  }
}
