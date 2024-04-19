class PicoHelper {
    static invalid(id, isInvalid) {
        const elem = document.getElementById(id);
        if (elem) {
            elem.ariaInvalid = isInvalid;
        }
    }

    static busy(id, isBusy) {
        const elem = document.getElementById(id);
        if (elem) {
            elem.ariaBusy = isBusy;
        }
    }

    static showModal(id) {
        const elem = document.getElementById(id);
        if (elem) {
            elem.setAttribute("open", "");
        }
    }

    static hideModal(id) {
        const elem = document.getElementById(id);
        if (elem) {
            elem.removeAttribute("open");
        }
    }
}
