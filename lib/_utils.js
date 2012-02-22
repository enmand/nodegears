/**
 * Utility or helpers to assist in different packages
 *
 * @author Velsoft Training Materials
 */
/**
 * I don't like doing to monkey pactching. @TODO Find a better way
 */
Object.prototype.findByValue = function(value)
{
	for(var i in this)
	{
		if(this[i].toString() == value.toString())
			return true;
	}
	return false;
}
