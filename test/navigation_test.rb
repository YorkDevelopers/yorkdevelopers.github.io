require 'test_helper'

LINKS = ['Blog', 'Events'].freeze
ANCHORS = ['About', 'Our Meetups', 'Tweets', 'News'].freeze

class IndexTest < CapybaraTestCase
  ALL_LINKS = LINKS + ANCHORS
  HOMEPAGE_CONTENT = ['YorkDevelopers.org', 'READ MORE'] + ALL_LINKS

  HOMEPAGE_CONTENT.each do |content|
    underscored_content = content.downcase.gsub(' ','_')
    define_method("test_homepage_has_#{underscored_content}_content") do
      visit '/'
      assert page.has_content?(content)
    end
  end

  LINKS.each do |link|
    underscored_link = link.downcase.gsub(' ','_')

    define_method("test_click_#{underscored_link}_navigates_to_#{underscored_link}") do
      visit '/'
      click_link link
      assert page.current_path == "/#{underscored_link}"
    end
  end


  def test_click_read_more_navigates_to_news
    visit '/'
    click_link 'READ MORE...'
    assert page.current_path == '/news'
  end
  # TODO test clicking anchor links
end
