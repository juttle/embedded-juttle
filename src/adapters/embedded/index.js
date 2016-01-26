function EmbeddedAdapter(config, Juttle) {
    return {
        name: 'embedded',
        read: require('./read')(config)
    };
}

module.exports = EmbeddedAdapter;
