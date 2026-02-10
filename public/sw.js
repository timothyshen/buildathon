self.addEventListener("push", function (event) {
  if (!event.data) return;

  var data = event.data.json();
  var options = {
    body: data.body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: { href: data.href || "/" },
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "SWA.XYZ", options)
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  var href = event.notification.data && event.notification.data.href ? event.notification.data.href : "/";
  event.waitUntil(clients.openWindow(href));
});
