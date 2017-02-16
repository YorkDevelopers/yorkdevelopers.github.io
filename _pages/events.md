---
layout: single
permalink: /events/
title: "Events"
excerpt: "Tech events in York"
---

{% for event in site.data.Events %}
<h2>{{ event.Name }}</h2>
<p>{{ event.Description }}</p>
{% endfor %}