---
layout: single
permalink: /events/
title: "Events"
excerpt: "Tech events in York"
---

{% assign items = site.data.Events | sort: 'Starts' %}
{% for event in items %}
    {% include events.html %}
{% endfor %}