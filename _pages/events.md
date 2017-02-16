---
layout: single
permalink: /events/
title: "Events"
excerpt: "Tech events in York"
---

{% for event in site.data.Events %}
    {% include events.html %}
{% endfor %}