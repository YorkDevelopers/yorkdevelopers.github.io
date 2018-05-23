require 'minitest/autorun'
require 'minitest/color'
require 'bundler/setup'
require 'capybara/dsl'
require 'rack/jekyll'
require 'yaml'

Capybara.app = Rack::Jekyll.new(force_build: true)

class CapybaraTestCase < MiniTest::Test
  include Capybara::DSL

  def teardown
    Capybara.reset_sessions!
    Capybara.use_default_driver
  end
end
