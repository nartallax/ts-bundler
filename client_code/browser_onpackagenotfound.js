function(r){
	throw new Error("Package is not defined by the time it is requested: \"" + r + "\" (or requested directly, which is also forbidden).");
}