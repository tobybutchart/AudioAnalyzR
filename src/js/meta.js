class Meta {
    static getMeta(name) {
        const metas = document.getElementsByTagName('meta');
        let ret = "";
        for (let i = 0; i < metas.length; i++) {
            if (metas[i].getAttribute('name') === name) {
                ret = metas[i].getAttribute('content');
                break;
            }
        }
        return ret;
    }
}
