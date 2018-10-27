function(name){
	var x = name, xx;
	while(true){
		xx = x.replace(/[^\/]+\/\.\.\//g, "");
		if(xx.length === x.length)
			break;
		x = xx;
	}
	while(true){
		xx = x.replace(/\.\//g, "");
		if(xx.length === x.length)
			break;
		x = xx;
	}
	return x;
}