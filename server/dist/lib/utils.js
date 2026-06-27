"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.avatarColorFromName = avatarColorFromName;
exports.initialsFromName = initialsFromName;
function avatarColorFromName(name) {
    const colors = ['#7c3aed', '#0891b2', '#16a34a', '#db2777', '#ea580c', '#0369a1'];
    let h = 0;
    for (const c of name)
        h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
    return colors[Math.abs(h) % colors.length];
}
function initialsFromName(name) {
    return name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');
}
