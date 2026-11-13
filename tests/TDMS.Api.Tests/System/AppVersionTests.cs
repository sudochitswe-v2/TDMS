using FluentAssertions;
using TDMS.Api.Abstructions;
using Xunit;

namespace TDMS.Api.Tests.System;

public class AppVersionTests
{
    [Fact]
    public void Parse_WithChannelSuffix_ShouldIdentifyVersionAndChannel()
    {
        var preview = AppVersion.Parse("1.0.0+preview");
        preview.Raw.Should().Be("1.0.0+preview");
        preview.Version.Should().Be("1.0.0");
        preview.Channel.Should().Be("preview");
        preview.IsStable.Should().BeFalse();

        var beta = AppVersion.Parse("2.1.0+beta");
        beta.Raw.Should().Be("2.1.0+beta");
        beta.Version.Should().Be("2.1.0");
        beta.Channel.Should().Be("beta");
        beta.IsStable.Should().BeFalse();

        var alpha = AppVersion.Parse("0.9.5-alpha");
        alpha.Raw.Should().Be("0.9.5-alpha");
        alpha.Version.Should().Be("0.9.5");
        alpha.Channel.Should().Be("alpha");
        alpha.IsStable.Should().BeFalse();
    }

    [Fact]
    public void Parse_WithoutChannel_ShouldDefaultChannelToStable()
    {
        var stable = AppVersion.Parse("1.0.0");
        stable.Raw.Should().Be("1.0.0");
        stable.Version.Should().Be("1.0.0");
        stable.Channel.Should().Be("stable");
        stable.IsStable.Should().BeTrue();
    }

    [Fact]
    public void Parse_WithExplicitStableChannel_ShouldBeStable()
    {
        var stable = AppVersion.Parse("1.0.0+stable");
        stable.Version.Should().Be("1.0.0");
        stable.Channel.Should().Be("stable");
        stable.IsStable.Should().BeTrue();
    }

    [Fact]
    public void Parse_NullOrEmpty_ShouldFallbackToDefaultVersion()
    {
        var defaultVer = AppVersion.Parse(null);
        defaultVer.Raw.Should().Be(AppVersion.DefaultVersion);
        defaultVer.Version.Should().Be("1.0.0");
        defaultVer.Channel.Should().Be("preview");
    }
}
